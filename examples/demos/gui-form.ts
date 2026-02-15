// GUI Form Demo - Interactive form with various controls
import { ImmediateRenderer } from 'vitrine';
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

export const demo = {
  id: 'gui-form',
  name: 'GUI Form',
  description: 'Interactive form with textboxes, checkboxes, buttons, and more',
  
  init: () => {
    return {
      formData: {
        name: '',
        email: '',
        subscribe: false,
        notifications: 'email',
        volume: 50,
        country: ''
      },
      currentTheme: 'dark',
      hoveredControl: null
    };
  },

  update: (state, dt) => {
    // No continuous updates needed for this demo
  },

  render: (state) => {
    // Select theme
    const themeMap = {
      light: lightTheme,
      dark: darkTheme,
      colorful: colorfulTheme
    };
    const theme = themeMap[state.currentTheme] || lightTheme;
    const context = { theme };

    // Build GUI tree
    const gui = panel(
      {
        x: 50,
        y: 30,
        width: 900,
        height: 680,
        title: 'User Registration Form',
        padding: 25
      },
      [
        vstack(
          { spacing: 25, padding: 0 },
          [
            // Name field
            vstack(
              { spacing: 8 },
              [
                label({ text: 'Full Name:', fontSize: 16 }),
                textbox({
                  width: 850,
                  height: 50,
                  value: state.formData.name,
                  placeholder: 'Enter your full name',
                  onChange: (val) => { state.formData.name = val; }
                })
              ]
            ),

            // Email field
            vstack(
              { spacing: 8 },
              [
                label({ text: 'Email Address:', fontSize: 16 }),
                textbox({
                  width: 850,
                  height: 50,
                  value: state.formData.email,
                  placeholder: 'your.email@example.com',
                  onChange: (val) => { state.formData.email = val; }
                })
              ]
            ),

            // Subscribe checkbox
            checkbox({
              label: 'Subscribe to newsletter',
              checked: state.formData.subscribe,
              onChange: (checked) => { state.formData.subscribe = checked; }
            }),

            // Notification preferences
            vstack(
              { spacing: 12 },
              [
                label({ text: 'Notification Preferences:', fontSize: 16 }),
                radiobutton({
                  label: 'Email notifications',
                  value: 'email',
                  group: 'notifications',
                  checked: state.formData.notifications === 'email',
                  onChange: (val) => { state.formData.notifications = val; }
                }),
                radiobutton({
                  label: 'SMS notifications',
                  value: 'sms',
                  group: 'notifications',
                  checked: state.formData.notifications === 'sms',
                  onChange: (val) => { state.formData.notifications = val; }
                }),
                radiobutton({
                  label: 'No notifications',
                  value: 'none',
                  group: 'notifications',
                  checked: state.formData.notifications === 'none',
                  onChange: (val) => { state.formData.notifications = val; }
                })
              ]
            ),

            // Volume slider
            vstack(
              { spacing: 12 },
              [
                label({ text: `Volume: ${Math.round(state.formData.volume)}%`, fontSize: 16 }),
                slider({
                  width: 850,
                  value: state.formData.volume,
                  min: 0,
                  max: 100,
                  onChange: (val) => { state.formData.volume = val; }
                })
              ]
            ),

            // Country dropdown
            vstack(
              { spacing: 8 },
              [
                label({ text: 'Country:', fontSize: 16 }),
                dropdown({
                  width: 850,
                  height: 50,
                  value: state.formData.country,
                  placeholder: 'Select your country',
                  options: [
                    { label: 'United States', value: 'us' },
                    { label: 'United Kingdom', value: 'uk' },
                    { label: 'Canada', value: 'ca' },
                    { label: 'Australia', value: 'au' },
                    { label: 'Germany', value: 'de' },
                    { label: 'France', value: 'fr' },
                    { label: 'Japan', value: 'jp' }
                  ],
                  onChange: (val) => { state.formData.country = val; }
                })
              ]
            ),

            // Action buttons and theme switcher
            hstack(
              { spacing: 15, alignment: 'center' },
              [
                button({
                  label: 'Submit',
                  variant: 'primary',
                  width: 160,
                  height: 50,
                  onClick: () => {
                    console.log('Form submitted:', state.formData);
                  }
                }),
                button({
                  label: 'Reset',
                  variant: 'secondary',
                  width: 160,
                  height: 50,
                  onClick: () => {
                    state.formData = {
                      name: '',
                      email: '',
                      subscribe: false,
                      notifications: 'email',
                      volume: 50,
                      country: ''
                    };
                  }
                }),
                button({
                  label: 'Theme: ' + state.currentTheme,
                  variant: 'secondary',
                  width: 200,
                  height: 50,
                  onClick: () => {
                    const themes = ['light', 'dark', 'colorful'];
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
