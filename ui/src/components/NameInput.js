import React from 'react';

const NameInput = (props) => {
  return (
    <div className="form-group">
      <label>
        Name
      </label>
      <input
        pattern=".{0}|.{3,40}" required
        title="Please enter a name between 3 and 50 characters"
        placeholder="required"
        className="form-control"
        value={props.playerName}
        onChange={props.onPlayerNameInputChange}
      />
    </div>
  );
}

export default NameInput;
