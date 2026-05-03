import TextField from '@mui/material/TextField'
import {
  USERNAME_HELPER,
  USERNAME_MAX,
  USERNAME_PATTERN,
  USERNAME_REGEX,
} from '../config/Constants'

export default function NameInput({ playerName, onPlayerNameInputChange }) {
  const showError = playerName.length > 0 && !USERNAME_REGEX.test(playerName)
  return (
    <TextField
      label="Your Name"
      value={playerName}
      onChange={onPlayerNameInputChange}
      autoFocus
      required
      fullWidth
      error={showError}
      helperText={USERNAME_HELPER}
      slotProps={{
        htmlInput: {
          pattern: USERNAME_PATTERN,
          maxLength: USERNAME_MAX,
        },
      }}
      sx={{ mb: 2.5 }}
    />
  )
}
