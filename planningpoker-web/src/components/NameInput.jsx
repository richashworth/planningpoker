import TextField from '@mui/material/TextField'

export default function NameInput({ playerName, onPlayerNameInputChange }) {
  return (
    <TextField
      label="Your Name"
      value={playerName}
      onChange={onPlayerNameInputChange}
      autoFocus
      required
      fullWidth
      slotProps={{
        htmlInput: {
          pattern: '[a-zA-Z0-9 _\\-]{3,20}',
          title: 'Name must be 3-20 characters: letters, numbers, spaces, hyphens, or underscores',
        },
      }}
      sx={{ mb: 2.5 }}
    />
  )
}
