import type { Meta, StoryObj } from '@storybook/react-vite';
import ProgramModal from './ProgramModal';
import { withProviders } from '../../../.storybook/decorators';

const meta = {
  title: 'Modals/ProgramModal',
  component: ProgramModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { isOpen: true, onClose: () => {}, programId: 'prog-1' },
} satisfies Meta<typeof ProgramModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GroupClasses: Story = {};
export const Fundamentals: Story = { args: { programId: 'prog-2' } };
export const Competitor: Story = { args: { programId: 'prog-3' } };
