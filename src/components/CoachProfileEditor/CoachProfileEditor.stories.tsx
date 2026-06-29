import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoachProfileEditor } from './CoachProfileEditor';
import { withProviders } from '../../../.storybook/decorators';
import { mockCoachUser } from '../../../.storybook/mockData';

// NOTE: loads the coach's profile on mount; without a backend it shows the
// blank editor form, which is what a coach with no profile yet would see.
const meta = {
  title: 'Coach/CoachProfileEditor',
  component: CoachProfileEditor,
  parameters: { layout: 'fullscreen', auth: mockCoachUser },
  decorators: [withProviders],
  args: { onSave: () => {} },
} satisfies Meta<typeof CoachProfileEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
