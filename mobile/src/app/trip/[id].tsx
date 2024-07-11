import { View, Text, TouchableOpacity, Keyboard, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { TripDetails, tripServer } from "@/server/trip-server";
import { Loading } from "@/components/loading";
import { Input } from "@/components/input";
import { CalendarRange, Info, MapPin, Settings2, Calendar as IconCalendar } from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Button } from "@/components/button";
import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { DateData } from "react-native-calendars";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";

export type TripData = TripDetails & { when: string }

enum MODAL {
    NONE = 0,
    UPDATE_TRIP = 2,
    CALENDAR = 1
}

export default function Trip(){
    const [isLoadingTrip, setIsLoadingTrip] = useState(true)
    const [tripDetails, setTripDetails] = useState({} as TripData)
    const [option, setOption] = useState<'activity' | 'details'>('activity')
    const [showModal, setShowModal] = useState(MODAL.NONE)
    const [destination, setDestination] = useState('')
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
    const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)


    const tripId = useLocalSearchParams<{ id: string }>().id

    async function getTripDetails(){
        try{
            setIsLoadingTrip(true)

            if(!tripId){
                return router.back()
            }

            const trip = await tripServer.getById(tripId)

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
            if(!tripId){
                return 
            }

            if(!destination || !selectedDates.startsAt || !selectedDates.endsAt){
                return Alert.alert('Update trip', 'Remember, in addition to filling in the destination, select the start and end date of the trip.')
            }

            setIsLoadingTrip(true)

            await tripServer.update({
                id: tripId,
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
        </View>
    )
}