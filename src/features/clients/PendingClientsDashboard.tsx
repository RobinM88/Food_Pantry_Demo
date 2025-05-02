import { Box, Typography } from '@mui/material';
import ClientList from './ClientList';
import { Client, MemberStatus } from '../../types';

interface PendingClientsDashboardProps {
  clients: Client[];
  onViewClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onStatusChange: (client: Client, newStatus: MemberStatus) => void;
}

export default function PendingClientsDashboard({
  clients,
  onViewClient,
  onEditClient,
  onDeleteClient,
  onStatusChange
}: PendingClientsDashboardProps) {
  const handleApproveClient = (client: Client) => {
    onStatusChange(client, MemberStatus.Active);
  };

  const handleRejectClient = (client: Client) => {
    onStatusChange(client, MemberStatus.Denied);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Clients
      </Typography>
      <ClientList
        clients={clients.filter(client => client.member_status === MemberStatus.Pending)}
        onViewClient={onViewClient}
        onEditClient={onEditClient}
        onDeleteClient={onDeleteClient}
        onApprove={handleApproveClient}
        onReject={handleRejectClient}
        hideAddButton
      />
    </Box>
  );
} 