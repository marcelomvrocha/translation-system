import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ArrowDropDown as ArrowDropDownIcon,
  Settings as SettingsIcon,
  Memory as MemoryIcon,
  Book as BookIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { ColumnPreset } from '@/types/columnIdentification';

interface PresetSelectorProps {
  presets: ColumnPreset[];
  onPresetSelect: (preset: ColumnPreset) => void;
  disabled?: boolean;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  onPresetSelect,
  disabled = false
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetSelect = (preset: ColumnPreset) => {
    onPresetSelect(preset);
    handleClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'common':
        return <SettingsIcon />;
      case 'translation_memory':
        return <MemoryIcon />;
      case 'glossary':
        return <BookIcon />;
      default:
        return <StarIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'common':
        return 'primary';
      case 'translation_memory':
        return 'secondary';
      case 'glossary':
        return 'success';
      default:
        return 'default';
    }
  };

  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, ColumnPreset[]>);

  return (
    <Box>
      <Button
        variant="outlined"
        endIcon={<ArrowDropDownIcon />}
        onClick={handleClick}
        disabled={disabled}
        sx={{ minWidth: 200 }}
      >
        Select Preset
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 300, maxHeight: 400 }
        }}
      >
        {Object.entries(groupedPresets).map(([category, categoryPresets], categoryIndex) => (
          <Box key={category}>
            {categoryIndex > 0 && <Divider />}
            
            <MenuItem disabled>
              <ListItemIcon>
                {getCategoryIcon(category)}
              </ListItemIcon>
              <ListItemText>
                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                  {category.replace('_', ' ')}
                </Typography>
              </ListItemText>
            </MenuItem>
            
            {categoryPresets.map((preset) => (
              <MenuItem
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                sx={{ pl: 4 }}
              >
                <ListItemText
                  primary={preset.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {preset.description}
                      </Typography>
                      <Box display="flex" gap={0.5} mt={0.5}>
                        {preset.mappings.slice(0, 3).map((mapping, index) => (
                          <Chip
                            key={index}
                            label={mapping.columnType}
                            color={getCategoryColor(mapping.columnType) as any}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                        {preset.mappings.length > 3 && (
                          <Chip
                            label={`+${preset.mappings.length - 3}`}
                            variant="outlined"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </MenuItem>
            ))}
          </Box>
        ))}
        
        {presets.length === 0 && (
          <MenuItem disabled>
            <ListItemText>
              <Typography variant="body2" color="text.secondary">
                No presets available
              </Typography>
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default PresetSelector;
