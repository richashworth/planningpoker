import React from 'react';
import TextField from '@mui/material/TextField';

export default function NameInput({ playerName, onPlayerNameInputChange }) {
  return (
    <TextField
      label="Name"
      value={playerName}
      onChange={onPlayerNameInputChange}
      autoFocus
      required
      fullWidth
      inputProps={{
        pattern: '.{0}|.{3,20}',
        title: 'Please enter a name between 3 and 20 characters',
      }}
      sx={{ mb: 2.5 }}
    />
  );
}
