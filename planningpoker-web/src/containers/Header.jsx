import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import LogoutIcon from '@mui/icons-material/Logout'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import MenuIcon from '@mui/icons-material/Menu'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import startCase from 'lodash/startCase'
import { leaveGame } from '../actions'
import { useColorMode } from '../App'
import Logo from '../components/Logo'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const host = useSelector((state) => state.game.host)
  const isHost = playerName?.toLowerCase() === host?.toLowerCase()
  const { toggleColorMode, mode } = useColorMode()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const showChipInHeader = isHost && !isMobile
  const [copied, setCopied] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  const handleLogout = () => {
    setAnchorEl(null)
    dispatch(leaveGame(playerName, sessionId, () => navigate('/')))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleThemeToggle = () => {
    setAnchorEl(null)
    toggleColorMode()
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
        <Logo size={isMobile ? 32 : 48} sx={{ mr: { xs: 0.5, sm: 2 } }} />
        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{
            fontWeight: 500,
            fontFamily: '"Lobster", cursive',
            fontSize: { xs: '1.5rem', sm: '2rem' },
            letterSpacing: 'normal',
            color: '#fff',
          }}
        >
          Planning Poker
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {sessionId ? (
          <>
            {showChipInHeader && (
              <Chip
                label={`Session ID: ${sessionId}`}
                size="small"
                deleteIcon={
                  <Tooltip title={copied ? 'Copied!' : 'Copy session ID'} arrow>
                    {copied ? (
                      <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 14 }} />
                    )}
                  </Tooltip>
                }
                onDelete={handleCopy}
                sx={{
                  ml: 1,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  height: 26,
                  borderRadius: 1,
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover': { color: '#fff' },
                  },
                }}
              />
            )}
            {isMobile ? (
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                aria-label="Open menu"
                sx={{
                  ml: 0.25,
                  color: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                endIcon={<ArrowDropDownIcon />}
                sx={{
                  ml: 1.5,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {startCase(playerName)}
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {isMobile && (
                <MenuItem disabled sx={{ opacity: '1 !important' }}>
                  <ListItemText
                    primary={startCase(playerName)}
                    secondary="Signed in"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </MenuItem>
              )}
              {isMobile && <Divider />}
              {!showChipInHeader && (
                <MenuItem onClick={handleCopy}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={copied ? 'Copied!' : 'Copy session ID'}
                    secondary={sessionId}
                    secondaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  />
                </MenuItem>
              )}
              {!showChipInHeader && <Divider />}
              <MenuItem onClick={handleThemeToggle}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {mode === 'dark' ? (
                    <LightModeOutlinedIcon fontSize="small" />
                  ) : (
                    <DarkModeOutlinedIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>{mode === 'dark' ? 'Light mode' : 'Dark mode'}</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                component="a"
                href="https://richashworth.com/blog/agile-estimation-for-distributed-teams/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAnchorEl(null)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>About</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Log out</ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : null}
      </Toolbar>
    </AppBar>
  )
}
