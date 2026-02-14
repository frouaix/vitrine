// GUI Dashboard Demo - Layout with panels and content
import { ImmediateRenderer } from 'vitrine';
import {
  vstack,
  hstack,
  label,
  button,
  panel,
  grid,
  transformGUIControl,
  darkTheme
} from '../../src/GUI/index.js';

export const demo = {
  id: 'gui-dashboard',
  name: 'GUI Dashboard',
  description: 'Dashboard layout with panels, grids, and statistics',
  
  init: () => {
    return {
      stats: {
        users: 1247,
        revenue: 89432,
        orders: 356,
        growth: 23.5
      },
      refreshCount: 0,
      time: 0
    };
  },

  update: (state, dt) => {
    state.time += dt;
    // Simulate live data updates
    if (Math.floor(state.time) !== Math.floor(state.time - dt)) {
      state.stats.users += Math.floor(Math.random() * 5);
      state.stats.orders += Math.floor(Math.random() * 3);
    }
  },

  render: (state) => {
    const context = { theme: darkTheme };

    // Build dashboard GUI
    const gui = vstack(
      { x: 20, y: 20, spacing: 20, padding: 0 },
      [
        // Header
        panel(
          { width: 760, height: 80, padding: 20 },
          [
            hstack(
              { spacing: 20, alignment: 'center' },
              [
                label({ 
                  text: '📊 Analytics Dashboard', 
                  fontSize: 24,
                  fontWeight: 'bold'
                }),
                button({
                  label: `Refresh (${state.refreshCount})`,
                  variant: 'primary',
                  x: 450,
                  onClick: () => {
                    state.refreshCount++;
                    state.stats.revenue += Math.floor(Math.random() * 1000);
                    state.stats.growth = parseFloat((Math.random() * 30).toFixed(1));
                  }
                })
              ]
            )
          ]
        ),

        // Stats grid
        grid(
          { columns: 4, spacing: 20, padding: 0 },
          [
            // Users stat
            panel(
              { width: 175, height: 120, padding: 15 },
              [
                vstack(
                  { spacing: 10 },
                  [
                    label({ text: 'Total Users', fontSize: 12 }),
                    label({ 
                      text: state.stats.users.toLocaleString(), 
                      fontSize: 28,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      text: '↑ +12.5%', 
                      fontSize: 11
                    })
                  ]
                )
              ]
            ),

            // Revenue stat
            panel(
              { width: 175, height: 120, padding: 15 },
              [
                vstack(
                  { spacing: 10 },
                  [
                    label({ text: 'Revenue', fontSize: 12 }),
                    label({ 
                      text: '$' + state.stats.revenue.toLocaleString(), 
                      fontSize: 28,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      text: `↑ +${state.stats.growth}%`, 
                      fontSize: 11
                    })
                  ]
                )
              ]
            ),

            // Orders stat
            panel(
              { width: 175, height: 120, padding: 15 },
              [
                vstack(
                  { spacing: 10 },
                  [
                    label({ text: 'Orders', fontSize: 12 }),
                    label({ 
                      text: state.stats.orders.toLocaleString(), 
                      fontSize: 28,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      text: '↑ +8.2%', 
                      fontSize: 11
                    })
                  ]
                )
              ]
            ),

            // Growth stat
            panel(
              { width: 175, height: 120, padding: 15 },
              [
                vstack(
                  { spacing: 10 },
                  [
                    label({ text: 'Growth', fontSize: 12 }),
                    label({ 
                      text: state.stats.growth + '%', 
                      fontSize: 28,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      text: '↑ +3.1%', 
                      fontSize: 11
                    })
                  ]
                )
              ]
            )
          ]
        ),

        // Main content panels
        hstack(
          { spacing: 20 },
          [
            // Recent activity
            panel(
              { width: 370, height: 300, padding: 15, title: 'Recent Activity' },
              [
                vstack(
                  { spacing: 12, y: 40 },
                  [
                    label({ text: '• User john@example.com registered', fontSize: 13 }),
                    label({ text: '• Order #1234 completed ($250)', fontSize: 13 }),
                    label({ text: '• New payment received', fontSize: 13 }),
                    label({ text: '• System backup completed', fontSize: 13 }),
                    label({ text: '• 5 new support tickets', fontSize: 13 }),
                    label({ text: '• Database optimized', fontSize: 13 }),
                    label({ text: '• Email campaign sent', fontSize: 13 })
                  ]
                )
              ]
            ),

            // Quick actions
            panel(
              { width: 370, height: 300, padding: 15, title: 'Quick Actions' },
              [
                grid(
                  { columns: 2, spacing: 10, y: 40 },
                  [
                    button({
                      label: 'New User',
                      variant: 'primary',
                      width: 165,
                      height: 50,
                      onClick: () => console.log('New user')
                    }),
                    button({
                      label: 'New Order',
                      variant: 'primary',
                      width: 165,
                      height: 50,
                      onClick: () => console.log('New order')
                    }),
                    button({
                      label: 'Reports',
                      variant: 'secondary',
                      width: 165,
                      height: 50,
                      onClick: () => console.log('Reports')
                    }),
                    button({
                      label: 'Settings',
                      variant: 'secondary',
                      width: 165,
                      height: 50,
                      onClick: () => console.log('Settings')
                    }),
                    button({
                      label: 'Export Data',
                      variant: 'secondary',
                      width: 165,
                      height: 50,
                      onClick: () => console.log('Export')
                    }),
                    button({
                      label: 'Help',
                      variant: 'secondary',
                      width: 165,
                      height: 50,
                      onClick: () => console.log('Help')
                    })
                  ]
                )
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
