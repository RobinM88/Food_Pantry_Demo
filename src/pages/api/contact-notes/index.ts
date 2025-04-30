import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { ContactNote } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const contactNote = await prisma.contactNote.create({
        data: {
          family_number: data.family_number,
          contact_date: new Date(data.contact_date),
          notes: data.notes,
          contact_purpose: data.contact_purpose,
          contact_method: data.contact_method
        }
      });
      res.status(201).json(contactNote);
    } catch (error) {
      console.error('Error creating contact note:', error);
      res.status(500).json({ error: 'Error creating contact note' });
    }
  } else if (req.method === 'GET') {
    try {
      const { family_number } = req.query;
      
      if (family_number) {
        const contactNotes = await prisma.contactNote.findMany({
          where: {
            family_number: family_number as string
          },
          orderBy: {
            contact_date: 'desc'
          }
        });
        res.status(200).json(contactNotes);
      } else {
        const contactNotes = await prisma.contactNote.findMany({
          orderBy: {
            contact_date: 'desc'
          }
        });
        res.status(200).json(contactNotes);
      }
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ error: 'Error fetching contact notes' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 