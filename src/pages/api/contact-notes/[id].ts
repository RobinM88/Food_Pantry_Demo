import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const contactNote = await prisma.contactNote.findUnique({
        where: { id: id as string }
      });
      
      if (!contactNote) {
        return res.status(404).json({ error: 'Contact note not found' });
      }
      
      res.status(200).json(contactNote);
    } catch (error) {
      console.error('Error fetching contact note:', error);
      res.status(500).json({ error: 'Error fetching contact note' });
    }
  } else if (req.method === 'PUT') {
    try {
      const data = req.body;
      const updatedNote = await prisma.contactNote.update({
        where: { id: id as string },
        data: {
          contact_date: data.contact_date ? new Date(data.contact_date) : undefined,
          notes: data.notes,
          contact_purpose: data.contact_purpose,
          contact_method: data.contact_method
        }
      });
      res.status(200).json(updatedNote);
    } catch (error) {
      console.error('Error updating contact note:', error);
      res.status(500).json({ error: 'Error updating contact note' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.contactNote.delete({
        where: { id: id as string }
      });
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting contact note:', error);
      res.status(500).json({ error: 'Error deleting contact note' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 