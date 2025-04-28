import { Grid, Card, CardContent, Typography, CardActionArea, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'

const quickAccessItems = [
  {
    title: 'Clients',
    description: 'Manage client profiles and information',
    icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    path: '/clients',
  },
  {
    title: 'Orders',
    description: 'Track and manage food orders',
    icon: <OrdersIcon sx={{ fontSize: 40 }} />,
    path: '/orders',
  },
  {
    title: 'Phone Logs',
    description: 'Record and manage phone interactions',
    icon: <PhoneIcon sx={{ fontSize: 40 }} />,
    path: '/phone-logs',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Food Pantry Client Management
      </Typography>
      <Typography variant="body1" paragraph>
        Select an option below to get started:
      </Typography>
      <Grid container spacing={3}>
        {quickAccessItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.title}>
            <Card>
              <CardActionArea onClick={() => navigate(item.path)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  {item.icon}
                  <Typography variant="h6" component="h2" sx={{ mt: 2 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  )
} 