import { Input } from '@/components/input'
import { View, Text, Image, Keyboard, Alert } from 'react-native'
import { useState } from 'react'

import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight } from 'lucide-react-native'

import { colors } from '@/styles/colors'
import { Button } from '@/components/button'
import { Modal } from '@/components/modal'
import { Calendar } from '@/components/calendar'

import {calendarUtils, DatesSelected } from '@/utils/calendarUtils'
import { DateData } from 'react-native-calendars'

import dayjs from 'dayjs'

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
    }

    function handleSelectedDate(selectedDay: DateData){
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        })

        setSelectedDates(dates)
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
                            <Input.Field placeholder='Who will be on the trip?'/>
                        </Input>
                    </>
                )}
                
                <Button onPress={handleNextStepForm}>
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
        </View>
    )
}