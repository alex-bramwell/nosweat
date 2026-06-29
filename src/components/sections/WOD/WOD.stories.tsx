import type { Meta, StoryObj } from '@storybook/react-vite';
import WOD from './WOD';
import { withProviders } from '../../../../.storybook/decorators';

// NOTE: WOD fetches today's workout from the backend on mount. With no live
// Supabase in Storybook it lands on its empty/sample state, which is still
// useful for reviewing layout, spacing and the booking panel chrome.
const meta = {
  title: 'Sections/WOD',
  component: WOD,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
} satisfies Meta<typeof WOD>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
