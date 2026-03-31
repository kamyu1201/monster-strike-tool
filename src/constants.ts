// Stage boundary ratios relative to screenshot dimensions.
// These are fixed across all stages.
// Values calibrated from sample.png — may need adjustment.
export const STAGE_LEFT_RATIO = 0.040;
export const STAGE_RIGHT_RATIO = 0.960;
export const STAGE_TOP_RATIO = 0.190;
export const STAGE_BOTTOM_RATIO = 0.675;

// Bottom card region ratios
export const CARD_REGION_TOP_RATIO = 0.78;
export const CARD_REGION_BOTTOM_RATIO = 0.88;

// Each card occupies 1/4 of the width, with some padding
export const CARD_COUNT = 4;
export const CARD_PADDING_RATIO = 0.05; // padding on left/right of card strip

// Defaults
export const DEFAULT_ANGLE = 90; // degrees, 0 = right, 90 = up
export const DEFAULT_REFLECTION_COUNT = 3;
export const DEFAULT_LINE_LENGTH_RATIO = 5.0; // multiplier of stage diagonal (max)
export const ANGLE_STEP = 0.25; // degrees per button press
export const ANGLE_STEP_FAST = 5; // degrees per long press tick

// Character label offset: character center is below and slightly to the right of the label
export const LABEL_TO_CHAR_OFFSET_X_RATIO = 0.01;
export const LABEL_TO_CHAR_OFFSET_Y_RATIO = 0.04;

// Block size as ratio of stage dimensions (square block)
export const BLOCK_SIZE_RATIO = 0.12; // block side length / stage width
