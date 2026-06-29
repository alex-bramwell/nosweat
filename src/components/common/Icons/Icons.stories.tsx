import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EditIcon, DeleteIcon, CloseIcon, ArrowUpIcon, ArrowDownIcon, ChevronUpIcon, ChevronDownIcon,
} from './Icons';

const ICONS = [
  ['EditIcon', EditIcon],
  ['DeleteIcon', DeleteIcon],
  ['CloseIcon', CloseIcon],
  ['ArrowUpIcon', ArrowUpIcon],
  ['ArrowDownIcon', ArrowDownIcon],
  ['ChevronUpIcon', ChevronUpIcon],
  ['ChevronDownIcon', ChevronDownIcon],
] as const;

const meta = { title: 'Common/Icons' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1.25rem' }}>
      {ICONS.map(([name, Icon]) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
          <Icon size={28} />
          <code style={{ fontSize: 12, color: 'var(--color-muted)' }}>{name}</code>
        </div>
      ))}
    </div>
  ),
};
