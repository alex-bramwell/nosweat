import { Button, Card, Container, Section, InfoTooltip } from '../components/common';
import { userManagementService } from '../services/userManagementService';
import { supabase } from '../lib/supabase';

const ComponentDemo = () => {
  const handleMakeDanAdmin = async () => {
    try {
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;
      const danUser = users.users.find(u => u.email === 'dan@crossfitcomet.com');

      if (!danUser) {
        alert("Dan's user not found.");
        return;
      }

      await userManagementService.updateUserRole({ userId: danUser.id, role: 'admin' });
      // Password reset would need to be done through Supabase dashboard or email flow
      alert('Dan is now an admin!');
    } catch (error) {
      console.error(error);
      alert('Failed to make Dan an admin. Check the console for errors.');
    }
  };

  return (
    <div>
      <Section spacing="large" background="default">
        <Container>
          <h1 style={{ marginBottom: '2rem' }}>UI Component Library</h1>

          <div style={{ border: '1px solid #ff4f1f', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Dev Tools</h2>
            <Button variant="primary" onClick={handleMakeDanAdmin}>Make Dan Admin</Button>
          </div>

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Tooltips</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>This is a simple tooltip:</span>
            <InfoTooltip content="This is a simple informational tooltip." />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
            <span>Tooltip with colored pills:</span>
            <InfoTooltip content="This is a green status, but this is a red warning." />
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
            <span>More complex tooltip:</span>
            <InfoTooltip content="Your summary is balanced (green), but some movements are underused (yellow). Avoid overused (red) exercises. This is actionable (blue) advice." />
          </div>

          <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Buttons</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Button variant="primary" size="small">Small</Button>
            <Button variant="primary" size="medium">Medium</Button>
            <Button variant="primary" size="large">Large</Button>
          </div>

          <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Cards</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <Card variant="default">
              <h3>Default Card</h3>
              <p>This is a default card with standard styling.</p>
            </Card>

            <Card variant="elevated">
              <h3>Elevated Card</h3>
              <p>This card has a shadow effect.</p>
            </Card>

            <Card variant="bordered">
              <h3>Bordered Card</h3>
              <p>This card has a border instead of shadow.</p>
            </Card>

            <Card variant="elevated" hoverable>
              <h3>Hoverable Card</h3>
              <p>Hover over me to see the effect!</p>
            </Card>
          </div>

          <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>Sections & Containers</h2>
          <p>This demo page uses Section and Container components for layout.</p>
        </Container>
      </Section>

      <Section spacing="medium" background="surface">
        <Container size="small">
          <h3>Small Container</h3>
          <p>This container has a max-width of 768px</p>
        </Container>
      </Section>

      <Section spacing="small" background="dark">
        <Container>
          <h3>Dark Background Section</h3>
          <p>Different background variants help create visual hierarchy.</p>
        </Container>
      </Section>
    </div>
  );
};

export default ComponentDemo;
