// Copyright (c) 2026 François Rouaix

// GUI Form Demo - Interactive form with various controls
import {
  vstack,
  hstack,
  label,
  textbox,
  checkbox,
  radiobutton,
  button,
  slider,
  dropdown,
  panel,
  transformGUIControl,
  lightTheme,
  darkTheme,
  colorfulTheme
} from '../../src/GUI/index.ts';

type ThemeKey = 'light' | 'dark' | 'colorful';

interface FormDemoState {
  formData: {
    name: string;
    email: string;
    fSubscribe: boolean;
    notifications: string;
    volume: number;
    country: string;
  };
  currentTheme: ThemeKey;
  hoveredControl: string | null;
  dropdownOpen: boolean;
}

export const demo = {
  id: 'gui-form',
  name: 'GUI Form',
  description: 'Interactive form with textboxes, checkboxes, buttons, and more',
  size: { width: 1000, height: 760 },
  
  init: (_renderer: unknown): FormDemoState => {
    return {
      formData: {
        name: '',
        email: '',
        fSubscribe: false,
        notifications: 'email',
        volume: 50,
        country: ''
      },
      currentTheme: 'dark',
      hoveredControl: null,
      dropdownOpen: false
    };
  },

  update: (state: FormDemoState, dt: number): void => {
    // No continuous updates needed for this demo
  },

  render: (state: FormDemoState) => {
    // Select theme
    const themeMap: Record<ThemeKey, typeof lightTheme> = {
      light: lightTheme,
      dark: darkTheme,
      colorful: colorfulTheme
    };
    const theme = themeMap[state.currentTheme];
    const context = { theme };

    // Build GUI tree
    const gui = panel(
      {
        x: 50,
        y: 30,
        dx: 900,
        dy: 680,
        stTitle: 'User Registration Form',
        duPadding: 25
      },
      [
        vstack(
          { duSpacing: 25, duPadding: 0 },
          [
            // Name field
            vstack(
              { duSpacing: 8 },
              [
                label({ stText: 'Full Name:', fontSize: 16 }),
                textbox({
                  dx: 850,
                  dy: 50,
                  stValue: state.formData.name,
                  stPlaceholder: 'Enter your full name',
                  onChange: (val) => { state.formData.name = val; }
                })
              ]
            ),

            // Email field
            vstack(
              { duSpacing: 8 },
              [
                label({ stText: 'Email Address:', fontSize: 16 }),
                textbox({
                  dx: 850,
                  dy: 50,
                  stValue: state.formData.email,
                  stPlaceholder: 'your.email@example.com',
                  onChange: (val) => { state.formData.email = val; }
                })
              ]
            ),

            // Subscribe checkbox
            checkbox({
              stLabel: 'Subscribe to newsletter',
              fChecked: state.formData.fSubscribe,
              onChange: (fChecked) => { state.formData.fSubscribe = fChecked; }
            }),

            // Notification preferences
            vstack(
              { duSpacing: 12 },
              [
                label({ stText: 'Notification Preferences:', fontSize: 16 }),
                radiobutton({
                  stLabel: 'Email notifications',
                  stValue: 'email',
                  group: 'notifications',
                  fChecked: state.formData.notifications === 'email',
                  onChange: (val) => { state.formData.notifications = val; }
                }),
                radiobutton({
                  stLabel: 'SMS notifications',
                  stValue: 'sms',
                  group: 'notifications',
                  fChecked: state.formData.notifications === 'sms',
                  onChange: (val) => { state.formData.notifications = val; }
                }),
                radiobutton({
                  stLabel: 'No notifications',
                  stValue: 'none',
                  group: 'notifications',
                  fChecked: state.formData.notifications === 'none',
                  onChange: (val) => { state.formData.notifications = val; }
                })
              ]
            ),

            // Volume slider
            vstack(
              { duSpacing: 12 },
              [
                label({ stText: `Volume: ${Math.round(state.formData.volume)}%`, fontSize: 16 }),
                hstack(
                  { duSpacing: 24, alignment: 'center' },
                  [
                    slider({
                      dx: 760,
                      value: state.formData.volume,
                      min: 0,
                      max: 100,
                      onChange: (val) => { state.formData.volume = val; }
                    }),
                    slider({
                      orientation: 'vertical',
                      dx: 36,
                      dy: 160,
                      value: state.formData.volume,
                      min: 0,
                      max: 100,
                      onChange: (val) => { state.formData.volume = val; }
                    })
                  ]
                )
              ]
            ),

            // Country dropdown
            vstack(
              { duSpacing: 8 },
              [
                label({ stText: 'Country:', fontSize: 16 }),
                dropdown({
                  dx: 850,
                  dy: 50,
                  stValue: state.formData.country,
                  stPlaceholder: 'Select your country',
                  fOpen: state.dropdownOpen,
                  options: [
                    { stLabel: 'United States', value: 'us' },
                    { stLabel: 'United Kingdom', value: 'uk' },
                    { stLabel: 'Canada', value: 'ca' },
                    { stLabel: 'Australia', value: 'au' },
                    { stLabel: 'Germany', value: 'de' },
                    { stLabel: 'France', value: 'fr' },
                    { stLabel: 'Japan', value: 'jp' }
                  ],
                  onChange: (val) => { state.formData.country = val; },
                  onToggle: (fOpen) => { state.dropdownOpen = fOpen; }
                })
              ]
            ),

            // Action buttons and theme switcher
            hstack(
              { duSpacing: 15, alignment: 'center' },
              [
                button({
                  stLabel: 'Submit',
                  variant: 'primary',
                  dx: 160,
                  dy: 50,
                  onClick: () => {
                    console.log('Form submitted:', state.formData);
                  }
                }),
                button({
                  stLabel: 'Reset',
                  variant: 'secondary',
                  dx: 160,
                  dy: 50,
                  onClick: () => {
                    state.formData = {
                      name: '',
                      email: '',
                      fSubscribe: false,
                      notifications: 'email',
                      volume: 50,
                      country: ''
                    };
                  }
                }),
                button({
                  stLabel: 'Theme: ' + state.currentTheme,
                  variant: 'secondary',
                  dx: 200,
                  dy: 50,
                  onClick: () => {
                    const themes: ThemeKey[] = ['light', 'dark', 'colorful'];
                    const currentIndex = themes.indexOf(state.currentTheme);
                    state.currentTheme = themes[(currentIndex + 1) % themes.length];
                  }
                })
              ]
            )
          ]
        )
      ]
    );

    // Transform GUI DSL to Core DSL
    return transformGUIControl(gui, context);
  }
};
