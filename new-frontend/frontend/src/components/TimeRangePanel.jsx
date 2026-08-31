// components/TimeRangePanel.jsx

import React from "react";
import TimeSelector from "./TimeSelector";
import "./TimeRangePanel.css";

const TimeRangePanel = ({
  timeOptions,
  selectedTimeStart,
  setSelectedTimeStart,
  selectedTimeEnd,
  setSelectedTimeEnd,
  timeMode,
  setTimeMode,
  relativeRange,
  setRelativeRange,
  onAnalyze,
}) => {
  return (
    <div className="time-range-panel">

      {/* Header */}
      <div className="time-range-header">
        <div>
          <h3 className="time-range-title">
            Select Time Range
          </h3>

          <p className="time-range-description">
            Choose how much sensor data you want to display.
          </p>
        </div>
      </div>

      {/* Absolute / Relative buttons */}
      <div className="time-mode-toggle">
        <button
          type="button"
          className={timeMode === "absolute" ? "active" : ""}
          onClick={() => setTimeMode("absolute")}
        >
          Absolute
        </button>

        <button
          type="button"
          className={timeMode === "relative" ? "active" : ""}
          onClick={() => setTimeMode("relative")}
        >
          Relative
        </button>
      </div>

      {/* Time range options */}
      <div className="time-range-grid">

        {/* Absolute time */}
        <div
          className={`time-range-section ${
            timeMode !== "absolute" ? "disabled" : ""
          }`}
        >
          <h4>Absolute time range</h4>

          <p className="section-description">
            Select a specific start and end time.
          </p>

          <TimeSelector
            label="Start"
            timeOptions={timeOptions}
            selectedTime={selectedTimeStart}
            setSelectedTime={setSelectedTimeStart}
            disabled={timeMode !== "absolute"}
          />

          <TimeSelector
            label="End"
            timeOptions={timeOptions}
            selectedTime={selectedTimeEnd}
            setSelectedTime={setSelectedTimeEnd}
            disabled={timeMode !== "absolute"}
          />
        </div>

        {/* Relative time */}
        <div
          className={`time-range-section ${
            timeMode !== "relative" ? "disabled" : ""
          }`}
        >
          <h4>Relative time range</h4>

          <p className="section-description">
            Display data from a recent time period.
          </p>

          <label
            className="relative-range-label"
            htmlFor="relative-time-range"
          >
            Time period
          </label>

          <select
            id="relative-time-range"
            className="relative-range-select"
            value={relativeRange}
            onChange={(e) => setRelativeRange(e.target.value)}
            disabled={timeMode !== "relative"}
          >
            <option value="5min">Last 5 minutes</option>
            <option value="15min">Last 15 minutes</option>
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      </div>

      {/* Apply button */}
      <div className="time-range-footer">
        <button
          type="button"
          className="analyze-btn"
          onClick={onAnalyze}
        >
          Apply Time Range
        </button>
      </div>

    </div>
  );
};

export default TimeRangePanel;