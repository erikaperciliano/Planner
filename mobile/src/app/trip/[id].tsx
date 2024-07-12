import { View, Text, TouchableOpacity, Keyboard, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { TripDetails, tripServer } from "@/server/trip-server";
import { Loading } from "@/components/loading";
import { Input } from "@/components/input";
import { CalendarRange, Info, MapPin, Settings2, Calendar as IconCalendar, User, Mail } from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Button } from "@/components/button";
import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { DateData } from "react-native-calendars";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { validateHeaderValue } from "http";
import { validateInput } from "@/utils/validateInput";
import { participantsServer } from "@/server/participants-server";
import { tripStorage } from "@/storage/trip";

export type TripData = TripDetails & { when: string }

enum MODAL {
    NONE = 0,
    UPDATE_TRIP = 2,
    CALENDAR = 1,
    CONFIRM_ATTENDANCE = 3
}

export default function Trip(){
    const [isLoadingTrip, setIsLoadingTrip] = useState(true)
    const [tripDetails, setTripDetails] = useState({} as TripData)
    const [option, setOption] = useState<'activity' | 'details'>('activity')
    const [showModal, setShowModal] = useState(MODAL.NONE)
    const [destination, setDestination] = useState('')
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
    const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)
    const [guestName, setGuestName] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [isConformingAttendance, setIsConformingAttendance] = useState(false)



    const tripParams = useLocalSearchParams<{ id: string, participant?:string }>()

    async function getTripDetails(){
        try{
            setIsLoadingTrip(true)

            if(!tripParams || !tripParams.id){
                return router.back()
            }

            const trip = await tripServer.getById(tripParams.id)

            const maxLenghtDestination = 14

            const destination = trip.destination.length > maxLenghtDestination 
            ? trip.destination.slice(0, maxLenghtDestination) + '...'
            : trip.destination

            const starts_at = dayjs(trip.starts_at).format('DD')
            const end_at = dayjs(trip.ends_at).format('DD')
            const month = dayjs(trip.starts_at).format('MMM')

            setDestination(trip.destination)

            setTripDetails({
                ...trip,
                when: `${destination} from ${starts_at} to ${end_at} from ${month}.`
            })

        }catch(error){
            console.log(error)
        }finally{
            setIsLoadingTrip(false)
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

    async function handleUpdateTrip(){
        try{
            if(!tripParams || !tripParams.id){
                return 
            }

            if(!destination || !selectedDates.startsAt || !selectedDates.endsAt){
                return Alert.alert('Update trip', 'Remember, in addition to filling in the destination, select the start and end date of the trip.')
            }

            setIsLoadingTrip(true)

            await tripServer.update({
                id: tripParams.id,
                destination,
                starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt.dateString).toString(),

            })
            
            Alert.alert('Update trip', 'Trip updated successfully!',[
                {
                    text: 'OK',
                    onPress: () => {
                        setShowModal(MODAL.NONE)
                        getTripDetails()
                    }
                }
            ])

        }catch(error){
            console.log(error)
        }finally{
            setIsUpdatingTrip(false)
        }
    }

    async function handleConfirmAttendance(){
        try{
            if(!tripParams.participant || !tripParams.id){
                return
            }

            if(!guestName.trim() || !guestEmail.trim()){
                return Alert.alert('Confirmation', 'Fill in name and email to confirm the trip!')
            }

            if(!validateInput.email(guestEmail.trim())){
                return Alert.alert('Confirmation', 'Invalid email!')
            }

            setIsConformingAttendance(true)

            await participantsServer.confirmTripByParticipantId({
                participantId: tripParams.participant,
                name: guestName,
                email: guestEmail,
            })

            Alert.alert('Confirmation', 'Trip confirm successfully!')

            await tripStorage.save(tripParams.id)

            setShowModal(MODAL.NONE)

        }catch(error){
            console.log(error)
            Alert.alert('Confirmation', 'Unable to confirm!')
        }finally{
            setIsConformingAttendance(false)
        }
    }

    async function handleRemoveTrip(){
        try{
            Alert.alert('Remove trip', 'Are you sure you want to remove the trip?', [
                {
                    text: 'No',
                    style: 'cancel'
                },
                {
                    text: 'Yes',
                    onPress: async() => {
                        await tripStorage.remove()
                        router.navigate('/')
                    }
                }
            ])
        }catch(error){
            console.log(error)
        }
    }

    useEffect(() => {
        getTripDetails()
    }, [])

    if(isLoadingTrip){
        return <Loading/>
    }

    return(
        <View className="flex-1 px-5 pt-16">
            <Input variant="tertiary">
                <MapPin color={colors.zinc[400]} size={20}/>
                <Input.Field value={tripDetails.when} readOnly/>

                <TouchableOpacity 
                    activeOpacity={0.6} 
                    className="w-9 h-9 bg-zinc-800 items-center rounded"
                    onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
                >
                    <Settings2 color={colors.zinc[400]} size={20}/>

                </TouchableOpacity>
            </Input>

            {
                option === "activity" ? (
                    <Activities tripDetails={tripDetails}/>
                ) : (
                    <Details tripId={tripDetails.id}/>
                )
            }

            <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
                <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
                    <Button 
                        className="w-44" 
                        onPress={() => setOption('activity')}
                        variant={option === 'activity' ? 'primary' : 'secondary'}
                    >
                        <CalendarRange
                            color={option === 'activity' ? colors.lime[950] : colors.zinc[200]} 
                            size={20}
                        />
                        <Button.Title>Activities</Button.Title>
                    </Button>

                    <Button 
                        className="w-44" onPress={() => setOption('details')} 
                        variant={option === 'details' ? 'primary' : 'secondary'}
                    >
                        <Info
                            color={option === 'details' ? colors.lime[950] : colors.zinc[200]} 
                            size={20}
                        />
                        <Button.Title>Details</Button.Title>
                    </Button>
                </View>
            </View>

            <Modal 
                title="Update trip"
                subtitle="Only those who created the trip can edit it."
                visible={showModal === MODAL.UPDATE_TRIP}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View className="gap-2 my-4">
                    <Input variant="secondary">
                        <MapPin color={colors.zinc[400]} size={20}/>
                        <Input.Field 
                            placeholder="Where?" 
                            onChangeText={setDestination}
                            value={destination}
                        />
                    </Input>

                    <Input variant="secondary">
                        <IconCalendar color={colors.zinc[400]} size={20}/>
                        <Input.Field 
                            placeholder="When?" 
                            value={selectedDates.formatDatesInText}
                            onPressIn={() => setShowModal(MODAL.CALENDAR)}
                            onFocus={() => Keyboard.dismiss()}
                        />
                    </Input>

                    <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
                        <Button.Title>Update</Button.Title>
                    </Button>

                    <TouchableOpacity activeOpacity={0.8} onPress={handleRemoveTrip}>
                        <Text className="text-red-400 text-center mt-6">Remove trip</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

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

                    <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
                        <Button.Title>Confirm</Button.Title>
                    </Button>
                </View>
            </Modal>

            <Modal title='Confirm attendance' visible={showModal === MODAL.CONFIRM_ATTENDANCE}>
                <View className="gap-4 mt-4">
                    <Text className="text-zinc-400 font-regular leading-6 my-2">
                        You have been invited to participate in a trip to {' '}
                        <Text className="font-semibold text-zinc-100">
                            {' '} {tripDetails.destination} {' '}
                        </Text>
                        on the dates of {' '}
                        <Text className="font-semibold text-zinc-100">
                            {dayjs(tripDetails.starts_at).date()} to {' '}
                            {dayjs(tripDetails.ends_at).date()} of {' '}
                            {dayjs(tripDetails.ends_at).format('MMMM')}. {'\n\n'}
                        </Text>
                        To confirm your presence on the trip, fill in the information below:
                    </Text>

                    <Input variant="secondary">
                        <User color={colors.zinc[400]} size={20}/>
                        <Input.Field placeholder="Full name" onChangeText={setGuestName}/>
                    </Input>

                    <Input variant="secondary">
                        <Mail color={colors.zinc[400]} size={20}/>
                        <Input.Field placeholder="Confirmation email" onChangeText={setGuestEmail}/>
                    </Input>

                    <Button isLoading={isConformingAttendance} onPress={handleConfirmAttendance}>
                        <Button.Title>Confirm my presence</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    )
}