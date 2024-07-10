import { Input } from '@/components/input'
import { View, Text, Image, Keyboard, Alert } from 'react-native'
import { useState } from 'react'

import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight, AtSign } from 'lucide-react-native'

import { colors } from '@/styles/colors'
import { Button } from '@/components/button'
import { Modal } from '@/components/modal'
import { Calendar } from '@/components/calendar'

import {calendarUtils, DatesSelected } from '@/utils/calendarUtils'
import { DateData } from 'react-native-calendars'

import dayjs from 'dayjs'
import { GuestEmail } from '@/components/email'
import { validateInput } from '@/utils/validateInput'
import { tripStorage } from '@/storage/trip'
import { router } from 'expo-router'
import { tripServer } from '@/server/trip-server'

enum StepForm {
    TRIP_DETAILS = 1,
    ADD_EMAIL = 2
}

enum MODAL  {
    NONE = 0,
    CALENDAR = 1,
    GUESTS = 2
}

export default function Index() {
    const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
    const [showModal, setShowModal] = useState(MODAL.NONE)
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
    const [destination, setDestination] = useState('')
    const [emailToInvite, setEmailToInvite] = useState('')
    const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])

    // LOADING
    const[isCreatingTrip, setIsCreatingTrip] = useState(false)


    function handleNextStepForm(){
        if(destination.trim().length === 0 || !selectedDates.startsAt || !selectedDates.endsAt){
            return Alert.alert('Trip details', 'Fill in all the trip information to continue.')
        }

        if(destination.length < 4){
            return Alert.alert('Trip details', 'The destination must be at least 4 characters long.')

        }

        if(stepForm === StepForm.TRIP_DETAILS){
            return setStepForm(StepForm.ADD_EMAIL)
        }

        Alert.alert('New trip', 'Confirm trip?', [
            {
                text: 'No',
                style: 'cancel'
            },
            {
                text: 'Yes',
                onPress: createTrip
            }
        ])
    }

    function handleSelectedDate(selectedDay: DateData){
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        })

        setSelectedDates(dates)
    }

    function handleRemoveEmail(emailToRemove: string){
        setEmailsToInvite((prevState) => 
            prevState.filter((email) => email !== emailToRemove)
        )
    }

    function handleAddEmail() {
        if(!validateInput.email(emailToInvite)){
            return Alert.alert('Guest', 'Invalid email!')
        }

        const emailAlreadyExists = emailsToInvite.find((email) => email === emailToInvite)
        
        if(emailAlreadyExists){
            return Alert.alert('Guest', 'Email has already been added!')
        }

        setEmailsToInvite((prevState) => [ ...prevState, emailToInvite])
        setEmailToInvite("")
    }

    async function saveTrip(tripId: string){
        try{
            await tripStorage.save(tripId)

            router.navigate('/trip/' + tripId)

        }catch(error){
            Alert.alert('Save trip', 'Unable to save trip ID to device.')
            console.log(error)
        }
    }

    async function createTrip(){
        try {
            setIsCreatingTrip(true)

            const newTrip = await tripServer.create({
                destination,
                starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
                emails_to_invite: emailsToInvite
            })

            Alert.alert('New trip', 'Trip created with successful!', [
                {
                    text: 'OK. Continue.',
                    onPress: () => saveTrip(newTrip.tripId)
                }
            ])

        }catch(error) {
            console.log('cai no CATCH')
            console.log(error)

            setIsCreatingTrip(false)
        }
    }

    return(
        <View className='flex-1 items-center justify-center px-5'>
            <Image 
                source={require('@/assets/logo.png')}
                className='h-8'
                resizeMode='contain'
            />
            <Image source={require('@/assets/bg.png')} className='absolute' />

            <Text  className='text-zinc-400 font-regular text-center text-lg mt-3'>
                Invite your friends and plan your{'\n'} next travel
            </Text>

            <View className='w-full bg-zinc-900 p-4 rounded-xl my-8 border border-l-zinc-800'>
                <Input>
                    <MapPin color={colors.zinc[400]} size={20}/>
                    <Input.Field 
                        placeholder='Where?' 
                        editable={ stepForm === StepForm.TRIP_DETAILS}
                        onChangeText={setDestination}
                        value={destination}
                    />
                </Input>

                <Input>
                    <IconCalendar color={colors.zinc[400]} size={20}/>
                    <Input.Field 
                        placeholder='When?'
                        editable={ stepForm === StepForm.TRIP_DETAILS}
                        onFocus={() => Keyboard.dismiss()}
                        showSoftInputOnFocus={false}
                        onPressIn={() => stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)}
                        value={selectedDates.formatDatesInText}
                    />
                </Input>

                { stepForm === StepForm.ADD_EMAIL && (
                    <>
                        <View className='border-b py-3 border-zinc-800'>
                            <Button variant='secondary' onPress={() => setStepForm(StepForm.TRIP_DETAILS)}>
                                <Button.Title>Change location/date</Button.Title>
                                <Settings2 color={colors.zinc[200]} size={20}/>
                            </Button>
                        </View>

                        <Input>
                            <UserRoundPlus color={colors.zinc[400]} size={20}/>
                            <Input.Field 
                                placeholder='Who will be on the trip?'
                                autoCorrect={false}
                                value={ 
                                    emailsToInvite.length > 0 ? `${emailsToInvite.length} invited people` : 
                                    '' 
                                }
                                onPress={() => {
                                    Keyboard.dismiss()
                                    setShowModal(MODAL.GUESTS)
                                }}
                                showSoftInputOnFocus={false}
                            />
                        </Input>
                    </>
                )}
                
                <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
                    <Button.Title>
                        {
                            stepForm === StepForm.TRIP_DETAILS ? 'Continue' : 'Confirm trip'
                        }
                    </Button.Title>
                    <ArrowRight color={colors.lime[950]} size={20}/>
                </Button>
            </View>

            <Text className='text-zinc-500 font-regular text-center text-base'>
                When planning your trip through plann.er you automatically agree to our{" "}
                <Text className='text-zinc-300 underline'>terms of use and privacy policies.</Text>
            </Text>

            <Modal 
                title='Select dates' 
                subtitle='Select the departure and return date of the trip'
                visible={showModal === MODAL.CALENDAR}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className='gap-4 mt-4'>
                    <Calendar 
                        minDate={dayjs().toISOString()}
                        onDayPress={handleSelectedDate}
                        markedDates={selectedDates.dates}
                    />

                    <Button onPress={() => setShowModal(MODAL.NONE)}>
                        <Button.Title>Confirm</Button.Title>
                    </Button>
                </View>
            </Modal>

            <Modal 
                title='Select guests' 
                subtitle='Guests will receive emails to confirm their participation in the trip.'
                visible={showModal === MODAL.GUESTS}
                onClose={() => setShowModal(MODAL.NONE)}
            >
               <View className='my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start'>
                    {
                        emailsToInvite.length > 0 ? (
                            emailsToInvite.map((email) => (
                                <GuestEmail 
                                    key={email}
                                    email={email}
                                    onRemove={() => handleRemoveEmail(email)}
                                />
                            ))
                        ) : (
                            <Text className='text-zinc-600 text-base font-regular'>No email added.</Text>
                        )
                    }
                </View>

                <View className='gap-4 mt-4'>
                    <Input variant='secondary'>
                        <AtSign color={colors.zinc[400]} size={20}/>
                        <Input.Field 
                            placeholder='Enter the guests email' 
                            keyboardType='email-address'
                            onChangeText={(text) => setEmailToInvite(text.toLowerCase())}
                            value={emailToInvite}
                            returnKeyType='send'
                            onSubmitEditing={handleAddEmail}
                        />
                    </Input>

                    <Button onPress={handleAddEmail}>
                        <Button.Title>Invite</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    )
}