// Copyright (c) 2026 François Rouaix

import type { Block, VitrinePointerEvent } from 'vitrine';
import { rectangle, text, group, portal } from 'vitrine';
import type { GUIControlOfType, TransformContext } from '../types.ts';
import { GUIControlType } from '../types.ts';
import { DROPDOWN_DEFAULTS } from './defaultsDropdown.ts';
import { COMMON_DEFAULTS, TEXT_DEFAULTS, getControlStyle } from '../constants.ts';

export function transformDropdown(
  control: GUIControlOfType<GUIControlType.Dropdown>,
  context: TransformContext,
  state: { fHovered?: boolean; fOpen?: boolean } = {}
): Block {
  const { props } = control;
  const {
    x: xp = COMMON_DEFAULTS.x,
    y: yp = COMMON_DEFAULTS.y,
    dx,
    dy,
    id,
    stValue,
    stPlaceholder,
    fVisible,
    fOpen,
    options,
    onChange,
    onToggle,
    onClick,
    onHover
  } = props;
  const style = getControlStyle(control, context);
  const {
    colBgHover,
    colBg,
    colBorder,
    borderWidth,
    borderRadius,
    colText,
    colTextDisabled,
    duPadding,
    fontSize,
    fontFamily
  } = style;
  
  const dxp = dx ?? DROPDOWN_DEFAULTS.dx;
  const dyp = dy ?? DROPDOWN_DEFAULTS.dy;
  
  const { fHovered } = state;

  const colBgActual = fHovered
    ? colBgHover || colBg
    : colBg;
  
  // Main dropdown click handler
  const handleMainClick = (event: VitrinePointerEvent) => {
    if (onToggle) {
      onToggle(!fOpen);
    }
    if (onClick) {
      onClick(event);
    }
  };
  
  const children: Block[] = [];
  
  // Background for main dropdown
  children.push(
    rectangle({
      dx: dxp,
      dy: dyp,
      fill: colBgActual,
      stroke: colBorder,
      strokeWidth: borderWidth,
      cornerRadius: borderRadius
    })
  );
  
  // Display text
  const selectedOption = options.find(opt => opt.value === stValue);
  const colTextActual = selectedOption ? colText : (colTextDisabled || colText);
  const stDisplay = selectedOption?.stLabel || stPlaceholder || DROPDOWN_DEFAULTS.stPlaceholder;
  
  children.push(
    text({
      text: stDisplay,
      x: duPadding || DROPDOWN_DEFAULTS.duTextPadding,
      y: dyp / 2,
      fill: colTextActual,
      fontSize,
      font: fontFamily,
        baseline: TEXT_DEFAULTS.baselineMiddle
    })
  );
  
  // Arrow indicator
  const stArrow = fOpen ? '▲' : DROPDOWN_DEFAULTS.stArrow;
  children.push(
    text({
      text: stArrow,
      x: dxp - (duPadding || DROPDOWN_DEFAULTS.duTextPadding) - DROPDOWN_DEFAULTS.duArrowOffsetX,
      y: dyp / 2,
      fill: colTextActual,
      fontSize: DROPDOWN_DEFAULTS.duArrowFont,
      baseline: TEXT_DEFAULTS.baselineMiddle
    })
  );
  
  // Expanded menu
  if (fOpen && options.length > 0) {
    const duItemHeight = dyp;
    const duMenuHeight = Math.min(options.length * duItemHeight, dyp * 6);
    const cVisibleItems = Math.floor(duMenuHeight / duItemHeight);
    const colItemSelected = colBgHover || colBg;
    
    const menuBlocks: Block[] = [];
    
    // Invisible backdrop for click-blocking
    menuBlocks.push(
      rectangle({
        x: 0,
        y: 0,
        dx: dxp,
        dy: duMenuHeight,
        fill: 'transparent',
        onClick: () => {
          if (onToggle) onToggle(false);
        }
      })
    );
    
    // Menu background
    menuBlocks.push(
      rectangle({
        x: 0,
        y: 0,
        dx: dxp,
        dy: duMenuHeight,
        fill: colBg,
        stroke: colBorder,
        strokeWidth: borderWidth,
        cornerRadius: borderRadius
      })
    );
    
    // Menu items
    const itemsToShow = options.slice(0, cVisibleItems);
    itemsToShow.forEach((option, index) => {
      const ypItem = index * duItemHeight;
      const fSelected = option.value === stValue;
      
      const handleItemClick = () => {
        if (onChange) {
          onChange(option.value);
        }
        if (onToggle) {
          onToggle(false);
        }
      };
      
      menuBlocks.push(
        rectangle({
          x: 0,
          y: ypItem,
          dx: dxp,
          dy: duItemHeight,
          fill: fSelected ? colItemSelected : 'transparent',
          onClick: handleItemClick
        })
      );
      
      menuBlocks.push(
        text({
          text: option.stLabel || option.value,
          x: duPadding || DROPDOWN_DEFAULTS.duTextPadding,
          y: ypItem + duItemHeight / 2,
          fill: colText,
          fontSize,
          font: fontFamily,
          baseline: TEXT_DEFAULTS.baselineMiddle
        })
      );
    });
    
    // Wrap menu in portal so it renders on top
    children.push(
      portal(
        {
          x: 0,
          y: dyp + 2
        },
        menuBlocks
      )
    );
  }
  
  return group(
    {
      x: xp,
      y: yp,
      visible: fVisible !== false,
      id,
      onClick: handleMainClick,
      onHover
    },
    children
  );
}
