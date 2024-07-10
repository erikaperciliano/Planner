import { env } from '@/env'
import { dayjs } from '@/lib/dayjs'
import { prisma } from '@/lib/prisma'
import { getMailClient } from '@/mail'
import nodemailer from 'nodemailer'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export const createTrip = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips',
    {
      schema: {
        tags: ['trips'],
        summary: 'Create a new trip',
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
          emails_to_invite: z.array(z.string().email()),
          owner_name: z.string(),
          owner_email: z.string().email(),
        }),
        response: {
          201: z.object({
            tripId: z.string().uuid(),
          }),
          400: z.object({ message: z.string() }).describe('Bad request'),
        },
      },
    },
    async (request, reply) => {
      const {
        starts_at,
        ends_at,
        destination,
        emails_to_invite,
        owner_name,
        owner_email,
      } = request.body

      console.log('Received request with data:', request.body)

      const currentDate = dayjs().startOf('day')
      const tripStartDate = dayjs(starts_at).startOf('day')
      const tripEndDate = dayjs(ends_at).startOf('day')

      if (tripStartDate.isBefore(currentDate)) {
        console.error('Invalid trip start date. starts_at:', starts_at)
        return reply.status(400).send({ message: 'Invalid trip start date.' })
      }

      if (tripEndDate.isBefore(tripStartDate)) {
        console.error(
          'Invalid trip end date. starts_at:',
          starts_at,
          'ends_at:',
          ends_at,
        )
        return reply.status(400).send({ message: 'Invalid trip end date.' })
      }

      try {
        const trip = await prisma.trip.create({
          data: {
            destination,
            starts_at,
            ends_at,
            participants: {
              createMany: {
                data: [
                  {
                    name: owner_name,
                    email: owner_email,
                    is_owner: true,
                    is_confirmed: true,
                  },
                  ...emails_to_invite.map((email) => {
                    return { email }
                  }),
                ],
              },
            },
          },
        })

        const mail = await getMailClient()

        const formattedTripStartDate = dayjs(starts_at).format('D[ de ]MMMM')
        const formattedTripEndDate = dayjs(ends_at).format('D[ de ]MMMM')

        const confirmationLink = new URL(
          `/trips/${trip.id}/confirm`,
          env.API_BASE_URL,
        )

        const message = await mail.sendMail({
          from: {
            name: 'Equipe plann.er',
            address: 'oi@plann.er',
          },
          to: {
            name: owner_name,
            address: owner_email,
          },
          subject: `Confirme sua viagem para ${destination} em ${formattedTripStartDate}`,
          html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> nas datas de ${formattedTripStartDate} até ${formattedTripEndDate}.</p>
              <p></p>
              <p>Para confirmar sua viagem, clique no link abaixo:</p>
              <p></p>
              <p>
                <a href="${confirmationLink.toString()}">Confirmar viagem</a>
              </p>
              <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
            </div>
          `.trim(),
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return reply.status(201).send({
          tripId: trip.id,
        })
      } catch (error) {
        console.error('Error creating trip:', error)
        return reply.status(500).send({ message: 'Error creating trip.' })
      }
    },
  )
}
