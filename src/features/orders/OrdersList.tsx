import React, { useState } from 'react';
import { TableCell, IconButton } from '@mui/material';
import { CheckCircleIcon, CancelIcon, BlockIcon, EditIcon, DeleteIcon } from '@mui/icons-material';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);

  const onStatusChange = (order, status) => {
    // Implement the logic to change the status of the order
  };

  const onEdit = (order) => {
    // Implement the logic to edit the order
  };

  const onDelete = (order) => {
    // Implement the logic to delete the order
  };

  return (
    <TableCell align="right">
      {orders.map((order) => (
        <>
          {order.status === 'pending' && (
            <>
              <IconButton
                color="success"
                onClick={() => onStatusChange(order, 'approved')}
                title="Approve"
              >
                <CheckCircleIcon />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => onStatusChange(order, 'denied')}
                title="Deny"
              >
                <CancelIcon />
              </IconButton>
            </>
          )}
          {order.status === 'scheduled' && (
            <IconButton
              color="primary"
              onClick={() => onStatusChange(order, 'ready')}
              title="Mark as Ready"
            >
              <CheckCircleIcon />
            </IconButton>
          )}
          <IconButton
            color="warning"
            onClick={() => onStatusChange(order, 'cancelled')}
            title="Cancel"
          >
            <BlockIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => onEdit(order)}
            title="Edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => onDelete(order)}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </>
      ))}
    </TableCell>
  );
};

export default OrdersList; 