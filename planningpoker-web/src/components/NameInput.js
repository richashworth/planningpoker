import React from 'react';

const NameInput = (props) => {
  return (
    <div className="form-group">
      <label>
        Name
      </label>
      <input
        autoFocus
        pattern=".{0}|.{3,20}" required
        title="Please enter a name between 3 and 20 characters"
        placeholder="required"
        className="form-control"
        value={props.playerName}
        onChange={props.onPlayerNameInputChange}
      />
    </div>
  )
};

export default NameInput;
