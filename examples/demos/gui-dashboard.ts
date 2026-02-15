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
} from '../../src/GUI/index.ts';

interface DashboardDemoState {
  stats: {
    users: number;
    revenue: number;
    orders: number;
    growth: number;
  };
  refreshCount: number;
  time: number;
}

export const demo = {
  id: 'gui-dashboard',
  name: 'GUI Dashboard',
  description: 'Dashboard layout with panels, grids, and statistics',
  
  init: (): DashboardDemoState => {
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

  update: (state: DashboardDemoState, dt: number): void => {
    state.time += dt;
    // Simulate live data updates
    if (Math.floor(state.time) !== Math.floor(state.time - dt)) {
      state.stats.users += Math.floor(Math.random() * 5);
      state.stats.orders += Math.floor(Math.random() * 3);
    }
  },

  render: (state: DashboardDemoState) => {
    const context = { theme: darkTheme };

    // Build dashboard GUI
    const gui = vstack(
      { x: 20, y: 20, spacing: 25, padding: 0 },
      [
        // Header
        panel(
          { dx: 960, dy: 100, padding: 25 },
          [
            hstack(
              { spacing: 25, alignment: 'center' },
              [
                label({ 
                  stText: '📊 Analytics Dashboard', 
                  fontSize: 28,
                  fontWeight: 'bold'
                }),
                button({
                  stLabel: `Refresh (${state.refreshCount})`,
                  variant: 'primary',
                  dx: 200,
                  dy: 50,
                  x: 520,
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
          { columns: 4, spacing: 25, padding: 0 },
          [
            // Users stat
            panel(
              { dx: 220, dy: 150, padding: 20 },
              [
                vstack(
                  { spacing: 12 },
                  [
                    label({ stText: 'Total Users', fontSize: 15 }),
                    label({ 
                      stText: state.stats.users.toLocaleString(), 
                      fontSize: 32,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      stText: '↑ +12.5%', 
                      fontSize: 14
                    })
                  ]
                )
              ]
            ),

            // Revenue stat
            panel(
              { dx: 220, dy: 150, padding: 20 },
              [
                vstack(
                  { spacing: 12 },
                  [
                    label({ stText: 'Revenue', fontSize: 15 }),
                    label({ 
                      stText: '$' + state.stats.revenue.toLocaleString(), 
                      fontSize: 32,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      stText: `↑ +${state.stats.growth}%`, 
                      fontSize: 14
                    })
                  ]
                )
              ]
            ),

            // Orders stat
            panel(
              { dx: 220, dy: 150, padding: 20 },
              [
                vstack(
                  { spacing: 12 },
                  [
                    label({ stText: 'Orders', fontSize: 15 }),
                    label({ 
                      stText: state.stats.orders.toLocaleString(), 
                      fontSize: 32,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      stText: '↑ +8.2%', 
                      fontSize: 14
                    })
                  ]
                )
              ]
            ),

            // Growth stat
            panel(
              { dx: 220, dy: 150, padding: 20 },
              [
                vstack(
                  { spacing: 12 },
                  [
                    label({ stText: 'Growth', fontSize: 15 }),
                    label({ 
                      stText: state.stats.growth + '%', 
                      fontSize: 32,
                      fontWeight: 'bold'
                    }),
                    label({ 
                      stText: '↑ +3.1%', 
                      fontSize: 14
                    })
                  ]
                )
              ]
            )
          ]
        ),

        // Main content panels
        hstack(
          { spacing: 25 },
          [
            // Recent activity
            panel(
              { dx: 468, dy: 360, padding: 20, stTitle: 'Recent Activity' },
              [
                vstack(
                  { spacing: 14, y: 50 },
                  [
                    label({ stText: '• User john@example.com registered', fontSize: 15 }),
                    label({ stText: '• Order #1234 completed ($250)', fontSize: 15 }),
                    label({ stText: '• New payment received', fontSize: 15 }),
                    label({ stText: '• System backup completed', fontSize: 15 }),
                    label({ stText: '• 5 new support tickets', fontSize: 15 }),
                    label({ stText: '• Database optimized', fontSize: 15 }),
                    label({ stText: '• Email campaign sent', fontSize: 15 })
                  ]
                )
              ]
            ),

            // Quick actions
            panel(
              { dx: 468, dy: 360, padding: 20, stTitle: 'Quick Actions' },
              [
                grid(
                  { columns: 2, spacing: 15, y: 50 },
                  [
                    button({
                      stLabel: 'New User',
                      variant: 'primary',
                      dx: 210,
                      dy: 55,
                      onClick: () => console.log('New user')
                    }),
                    button({
                      stLabel: 'New Order',
                      variant: 'primary',
                      dx: 210,
                      dy: 55,
                      onClick: () => console.log('New order')
                    }),
                    button({
                      stLabel: 'Reports',
                      variant: 'secondary',
                      dx: 210,
                      dy: 55,
                      onClick: () => console.log('Reports')
                    }),
                    button({
                      stLabel: 'Settings',
                      variant: 'secondary',
                      dx: 210,
                      dy: 55,
                      onClick: () => console.log('Settings')
                    }),
                    button({
                      stLabel: 'Export Data',
                      variant: 'secondary',
                      dx: 210,
                      dy: 55,
                      onClick: () => console.log('Export')
                    }),
                    button({
                      stLabel: 'Help',
                      variant: 'secondary',
                      dx: 210,
                      dy: 55,
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
