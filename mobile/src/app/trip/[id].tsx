import { View, Text, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { TripDetails, tripServer } from "@/server/trip-server";
import { Loading } from "@/components/loading";
import { Input } from "@/components/input";
import { MapPin, Settings2 } from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Button } from "@/components/button";

type TripData = TripDetails & { when: string }

export default function Trip(){
    const [isLoadingTrip, setIsLoadingTrip] = useState(true)
    const [tripDetails, setTripDetails] = useState({} as TripData)


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
                >
                    <Settings2 color={colors.zinc[400]} size={20}/>

                </TouchableOpacity>
            </Input>

            <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
                <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
                    <Button className="flex-1">
                        <Button.Title>Activities</Button.Title>
                    </Button>

                    <Button className="flex-1">
                        <Button.Title>Details</Button.Title>
                    </Button>
                </View>
            </View>
        </View>
    )
}