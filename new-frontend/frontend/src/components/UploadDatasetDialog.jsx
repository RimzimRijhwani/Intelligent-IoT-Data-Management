import { useState } from "react";
import "./UploadDatasetDialog.css";

const predefinedFields = [
    "field1",
    "field2",
    "field3",
    "field4",
    "field5",
    "field6",
    "field7",
    "field8",
];


const UploadDatasetDialog = ({ onClose }) => {
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [timestampColumn, setTimestampColumn] = useState("");
    const [columnConfig, setColumnConfig] = useState([]);
    const [error, setError] = useState("");

    const detectTimestampColumn = (headers) => {
        const timestampNames = [
            "created_at",
            "timestamp",
            "datetime",
            "date_time",
            "time",
            "date",
            "recorded_at",
            "reading_time",
        ];

        const detectedColumn = headers.find((header) =>
            timestampNames.includes(header.toLowerCase())
        );
        return detectedColumn || "";
    };

    const detectDataType = (column, rows) => {
        const values = rows.map((row) => row[column]).filter((value) =>

            value !== undefined &&
            value !== null &&
            value.trim() !== ""
        );

        if (values.length === 0) {
            return "Unknown";
        }

        const allNumeric = values.every(
            (value) => !Number.isNaN(Number(value))
        );

        if (allNumeric) {
            return "Number";
        }

        return "Text";
    };

    const parseCSVLine = (line) => {
        const values = [];
        let currentValue = "";
        let insideQuotes = false;

        for(let i =0; i < line.length; i++){
            const character = line[i];

            if(character === '"'){
                if(insideQuotes && line[i+1] ==='"'){
                    currentValue += '"';
                    i++;

                }else{
                    insideQuotes = !insideQuotes;
                }
            }else if(character === "," && !insideQuotes){
                values.push(currentValue.trim());
                currentValue = "";
            }else{
                currentValue += character;
            }
        }
        return values;
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a CSV file.");

            setFile(null);
            setColumns([]);
            setPreviewData([]);
            setTimestampColumn("");
            setColumnConfig([]);

            return;
        }

        setFile(selectedFile);
        setError("");

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target.result;

                const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

                if (lines.length < 2) {
                    setError("CSV file does not contain any data.");

                    setColumns([]);
                    setPreviewData([]);
                    setTimestampColumn("");
                    setColumnConfig([]);

                    return;
                }

                const headers = parseCSVLine(lines[0]);
                if (headers.length < 2) {
                    setError("CSV file must have a timestamp and sensor column");

                    setColumns([]);
                    setPreviewData([]);
                    setTimestampColumn("");
                    setColumnConfig([]);

                    return;
                }

                const rows = lines.slice(1, 6).map((line) => {
                    const values = parseCSVLine(line);
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] ?? "";
                    });
                    return row;
                });

                setColumns(headers);
                setPreviewData(rows);

                const detectedTimestamp = detectTimestampColumn(headers);
                setTimestampColumn(detectedTimestamp);

                const config = headers.filter((header) =>
                    header !== detectedTimestamp
                ).map((header) => ({
                    columnName: header,

                    dataType: detectDataType(
                        header,
                        rows
                    ),
                    import: false,
                    backendField: "",

                    displayName: header,
                }));

                setColumnConfig(config);
                setError("");
            } catch (err) {
                console.error(err);

                setError("Unable to read CSV file");

                setColumns([]);
                setPreviewData([]);
                setTimestampColumn("");
                setColumnConfig([]);
            }
        };

        reader.onerror = () => {
            setError("Unable to read CSV file");
        };
        reader.readAsText(selectedFile);
    };

    const handleTimestampChange = (event) => {
        const newTimestamp = event.target.value;
        setTimestampColumn(newTimestamp);

        const newConfig = columns.filter((column) => column !== newTimestamp).map((column) => {
            const existingConfig = columnConfig.find((item) => item.columnName === column);

            if (existingConfig) {
                return existingConfig;
            }

            return {
                columnName: column,

                dataType: detectDataType(
                    column,
                    previewData
                ),
                import: false,
                backendField: "",
                displayName: column,
            };
        });
        setColumnConfig(newConfig);
        setError("");
    };

    const handleImportChange = (index) => {
        const currentColumn = columnConfig[index];

        if (currentColumn.dataType !== "Number") {
            return;
        }

        if (!currentColumn.import) {
            const selectedColumns = columnConfig.filter(
                (column) => column.import
            );

            if (selectedColumns.length >= 8) {
                setError("A maximum of 8 sensor columns can be imported");
                return;
            }

            const usedFields = selectedColumns.map(
                (column) => column.backendField
            );

            const availableField = predefinedFields.find(
                (field) => !usedFields.includes(field)
            );

            const updatedConfig = columnConfig.map(
                (column, columnIndex) => columnIndex === index
                    ? {
                        ...column,
                        import: true,
                        backendField: availableField || "",
                    }
                    : column
            );
            setColumnConfig(updatedConfig);
            setError("");
            return;
        }

        const updatedConfig = columnConfig.map(
            (column, columnIndex) => columnIndex === index
                ? {
                    ...column,
                    import: false,
                    backendField: ""
                }
                : column
        );
        setColumnConfig(updatedConfig);
        setError("");
    };

    const handleBackendFieldChange = (index, field) => {
        const updatedConfig = columnConfig.map(
            (column, columnIndex) =>
                columnIndex === index ? {
                    ...column,
                    backendField: field,
                }
                    : column
        );
        setColumnConfig(updatedConfig);
        setError("");
    };

    const handleDisplayNameChange = (index, displayName) => {
        const updatedConfig = columnConfig.map((column, columnIndex) =>
            columnIndex === index ? {
                ...column,
                displayName,
            } : column

        );
        setColumnConfig(updatedConfig);
        setError("");
    };

    const handleConfirm = () => {
        if (!file) {
            setError("Please select a CSV file");
            return;
        }

        if(!timestampColumn){
            setError("Please select a timestamp column before confirming the upload");

            return;
        }
        const selectedSensors = columnConfig.filter((column) => column.import);

        if (selectedSensors.length === 0) {
            setError("Please select atleast one sensor column");
            return;
        }

        if (selectedSensors.length > 8) {
            setError("A maximum of 8 sensor column can be imported");

            return;
        }

        const missingBackendField = selectedSensors.some((column) => !column.backendField);

        if (missingBackendField) {
            setError("Please select a backend field for every imported sensor.");
            return;
        }

        const backendFields = selectedSensors.map((column) => column.backendField);
        if (new Set(backendFields).size !== backendFields.length) {
            setError("Each sensor must use a different backend field");
            return;
        }

        const missingDisplayName = selectedSensors.some((column) => !column.displayName.trim());
        if (missingDisplayName) {
            setError("Please enter a display name for imported sensor.");
            return;
        }

        const displayNames = selectedSensors.map((column) => column.displayName.trim().toLowerCase());
        if (new Set(displayNames).size !== displayNames.length) {
            setError("Display names must be unique.");
            return;
        }
        setError("");

        const sensorMappings = selectedSensors.map((column) => ({
            sourceColumn: column.columnName,
            field: column.backendField,
            displayName: column.displayName.trim(),
        }));

        const uploadConfig = {
            file,
            timestampColumn,
            sensors: sensorMappings,
        };

        console.log("Upload Configuration", uploadConfig);
        console.log("Timestamp:", timestampColumn);
        console.log("Sensors:", sensorMappings);
    };

    const selectedSensorCount = columnConfig.filter((column) => column.import).length;




    return (
        <div className="dialog-overlay">
            <div className="upload-dialog">

                <div className="dialog-header">
                    <h2>Upload Dataset</h2>

                    <button type="button" className="close-dialog" onClick={onClose}>
                        x
                    </button>
                </div>

                <p>
                    Upload a CSV file and preview data.
                </p>

                <div className="file-section">
                    <label htmlFor="dataset-file">
                        Select CSV File
                    </label>

                    <input id="dataset-file" type="file" accept=".csv"
                        onChange={
                            handleFileChange
                        }
                    />
                    {file && (
                        <p className="selected-file">
                            Selected:{" "} <strong>{file.name}</strong>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                {columns.length > 0 && (

                    <div className="timestamp-section">
                        <h3>Timestamp Column</h3>
                        <p> Select the column that contains the timestamp for each sensor reading.</p>
                        <select value={timestampColumn} onChange={handleTimestampChange}>
                            <option value=""> Select timestamp column</option>
                            {columns.map((column) => (
                                <option key={column} value={column}>
                                    {column}</option>
                            )
                            )}
                        </select>
                        {timestampColumn && (
                            <p className="timestamp-detected">
                                Selected timestamp:{" "}
                                <strong>{timestampColumn}</strong>
                            </p>
                        )}
                    </div>
                )}

                {columnConfig.length > 0 && (
                    <div className="sensor-field-section">
                        <div className="sensor-field-header">
                            <div>
                                <h3>Select Sensor Fields</h3>
                                <p> Select up to eight numeric columns to import and configure how they will be stored. </p>
                            </div>

                            <span className="field-count">
                                {selectedSensorCount}
                                {" / 8 selected"}
                            </span>
                        </div>

                        <div className="column-config-wrapper">
                            <table className="column-config-table">
                                <thead>
                                    <tr>
                                        <th> Import</th>
                                        <th> Column Name</th>
                                        <th> Data Type </th>
                                        <th> Store As </th>
                                        <th> Display Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {columnConfig.map((column, index) => {
                                        const isNumeric = column.dataType === "Number";
                                        return (
                                            <tr key={column.columnName}>
                                                <td>
                                                    <input type="checkbox" checked={column.import} disabled={!isNumeric} onChange={() => handleImportChange(index)} />
                                                </td>
                                                <td>
                                                    <strong>{column.columnName}</strong>
                                                </td>
                                                <td>
                                                    <span className={isNumeric ? "data-type data-type--number" : "data-type data-type--text"}>
                                                        {column.dataType}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isNumeric ? (
                                                        <select value={column.backendField} disabled={!column.import} onChange={(event) =>
                                                            handleBackendFieldChange(index, event.target.value)} >
                                                            <option value=""> Select field </option>
                                                            {predefinedFields.map((field) => {
                                                                const alreadyUsed = columnConfig.some((item, itemIndex) =>
                                                                    item.backendField === field && itemIndex !== index);
                                                                return (
                                                                    <option key={field} value={field} disabled={alreadyUsed}>
                                                                        {field}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    ) : (
                                                        <span className="not-available"> Not available</span>)}
                                                </td>
                                                <td>
                                                    {isNumeric ? (
                                                        <input type="text" value={column.displayName} disabled={!column.import} placeholder="Display name" onChange={(event) =>
                                                            handleDisplayNameChange(index, event.target.value)} />
                                                    ) : (<span className="not-available"> — </span>)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                        </div>

                    </div>
                )}


                {previewData.length >
                    0 && (
                        <div className="preview-section">

                            <h3>
                                CSV Preview
                            </h3>

                            <p>
                                Showing the first{" "}
                                {previewData.length}{" "}
                                rows.
                            </p>

                            <div className="preview-table-wrapper">

                                <table className="preview-table">

                                    <thead>

                                        <tr>

                                            {columns.map((column) => (
                                                <th key={column}>
                                                    {column}
                                                </th>
                                            ))}

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {previewData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {columns.map((column) => (
                                                    <td key={column}>
                                                        {row[column]}
                                                    </td>

                                                ))}
                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>
                    )}



                <div className="dialog-actions">

                    <button type="button" className="cancel-button" onClick={onClose}>Cancel </button>
                    <button type="button" className="confirm-button" onClick={handleConfirm} disabled={!file || !timestampColumn}>Confirm</button>

                </div>

            </div>

        </div>
    );
};

export default UploadDatasetDialog;