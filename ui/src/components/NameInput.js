import React from 'react';

const NameInput = (props) => {
  return <div className="form-group">
    <label>
      Name
    </label>
    <input
      pattern=".{0}|.{3,}" required
      title="Name must contain at least 3 characters"
      placeholder="Enter Text"
      className="form-control"
      value={props.playerName}
      onChange={props.onPlayerNameInputChange}
    />
  </div>
}

export default NameInput;
