import { useState } from "react";
import "./UploadDatasetDialog.css";


const UploadDatasetDialog = ({onClose}) => {
    const[file, setFile] = useState(null);
    const[columns, setColumns] = useState([]);
    const[previewData, setPreviewData] = useState([]);
    const [fieldNames, setFieldNames] = useState({});
    const[error, setError] = useState("");

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];

        if(!selectedFile) return;

        if(!selectedFile.name.toLowerCase().endsWith(".csv")){
            setError("Please select a CSV file.");
            return;
        }

        setFile(selectedFile);
        setError("");

        const reader = new FileReader();

        reader.onload = (event) =>{
            const text = event.target.result;

            const lines = text.split(/\r?\n/).filter((line) => line.trim() !=="");

            if(lines.length < 2){
                setError("CSV file does not contain any data.");
                return;
            }
            const headers = lines[0].split(",").map((header) => header.trim());
            const initialFieldNames = {};

            headers.forEach((header) => {
                initialFieldNames[header] = header;
            });

            const rows = lines.slice(1, 6).map((line) => {
                const values = line.split(",").map((value) => value.trim());

                const row = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] ?? "";
                });
                return row;
            });

            setColumns(headers);
            setPreviewData(rows);
            setFieldNames(initialFieldNames);


        };
        reader.readAsText(selectedFile);
    };
    
    const handleFieldNameChange = (originalField, newName) => {
        setFieldNames((previousNames) => ({
            ...previousNames,
            [originalField] : newName,
        }));
    };
    const handleConfirm = () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }
        
        const hasEmptyFieldName = columns.some(
            (column) => !fieldNames[column]?.trim()
        );
        if (hasEmptyFieldName) {
            setError("Please provide a name for every field.");
            return;
        }
        
        const names = columns.map(
            (column) => fieldNames[column].trim()
        );
        
        const uniqueNames = new Set(
            names.map((name) => name.toLowerCase())
        );
        
        if (uniqueNames.size !== names.length) {
            setError("Field names must be unique.");
            return;
        }
        setError("");
        console.log("Confirmed file:", file);
        console.log("Field names:", fieldNames);
    };

    return(
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

                <input type="file" accept=".csv" onChange={handleFileChange} />
                {file && (
                    <p>
                        Selected: <strong>{file.name}</strong>
                    </p>
                )}

                {columns.length >0 &&(
                    <div className="field-mapping-section">
                        <h3>Field Names</h3>
                        <p>Give each field a meaningful name</p>

                        <div className="field-mapping-list">
                            {columns.map((column) => (
                                <div className="field-mapping-rows" key={column}>
                                    <span className="original-field">{column}</span>
                                    <span className="field-arrow">→</span>
                                    <input type="text"
                                    value={fieldNames[column] || ""}
                                    onChange={(event) =>
                                        handleFieldNameChange(
                                            column,
                                            event.target.value
                                        )
                                    } />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="error-message">
                        {error}
                    </p>
                )}

                {previewData.length > 0 && (
                    <div className="preview-section">
                        <h3>Preview</h3>
                        <p>
                            Showing first {previewData.length} rows
                        </p>

                        <div className="preview-table-wrapper">
                            <table className="preview-table">
                                <thead>
                                    <tr>
                                        {columns.map((column) => (
                                            <th key={column}>
                                                {fieldNames[column] || column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {columns.map((column) =>(
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
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>

                    <button type="button" onClick={handleConfirm} disabled = {!file}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );

};

export default UploadDatasetDialog;