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
} from '../../src/GUI/index.js';

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
      currentTheme: 'light',
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
        width: 700,
        height: 540,
        title: 'User Registration Form',
        padding: 20
      },
      [
        vstack(
          { spacing: 20, padding: 0 },
          [
            // Name field
            vstack(
              { spacing: 5 },
              [
                label({ text: 'Full Name:', fontSize: 14 }),
                textbox({
                  width: 660,
                  value: state.formData.name,
                  placeholder: 'Enter your full name',
                  onChange: (val) => { state.formData.name = val; }
                })
              ]
            ),

            // Email field
            vstack(
              { spacing: 5 },
              [
                label({ text: 'Email Address:', fontSize: 14 }),
                textbox({
                  width: 660,
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
              { spacing: 8 },
              [
                label({ text: 'Notification Preferences:', fontSize: 14 }),
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
              { spacing: 8 },
              [
                label({ text: `Volume: ${Math.round(state.formData.volume)}%`, fontSize: 14 }),
                slider({
                  width: 660,
                  value: state.formData.volume,
                  min: 0,
                  max: 100,
                  onChange: (val) => { state.formData.volume = val; }
                })
              ]
            ),

            // Country dropdown
            vstack(
              { spacing: 5 },
              [
                label({ text: 'Country:', fontSize: 14 }),
                dropdown({
                  width: 660,
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
              { spacing: 10, alignment: 'center' },
              [
                button({
                  label: 'Submit',
                  variant: 'primary',
                  onClick: () => {
                    console.log('Form submitted:', state.formData);
                    alert('Form submitted! Check console for data.');
                  }
                }),
                button({
                  label: 'Reset',
                  variant: 'secondary',
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
                  width: 150,
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
