import TextField from '@mui/material/TextField'
import { USERNAME_PATTERN } from '../config/Constants'

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
          pattern: USERNAME_PATTERN,
          title: 'Name must be 3-20 characters: letters, numbers, spaces, hyphens, or underscores',
        },
      }}
      sx={{ mb: 2.5 }}
    />
  )
}
