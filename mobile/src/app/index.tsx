import { Input } from '@/components/input'
import { View, Text, Image } from 'react-native'

import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight } from 'lucide-react-native'

import { colors } from '@/styles/colors'
import { Button } from '@/components/button'

export default function Index() {
    return(
        <View className='flex-1 items-center justify-center px-5'>
            <Image 
                source={require('@/assets/logo.png')}
                className='h-8'
                resizeMode='contain'
            />

            <Text  className='text-zinc-400 font-regular text-center text-lg mt-3'>
                Invite your friends and plan your{'\n'} next travel
            </Text>

            <View className='w-full bg-zinc-900 p-4 rounded-xl my-8 border border-l-zinc-800'>
                <Input>
                    <MapPin color={colors.zinc[400]} size={20}/>
                    <Input.Field placeholder='Where?'/>
                </Input>

                <Input>
                    <IconCalendar color={colors.zinc[400]} size={20}/>
                    <Input.Field placeholder='When?'/>
                </Input>

                <View className='border-b py-3 border-zinc-800'>
                    <Button variant='secondary'>
                        <Button.Title>Change location/date</Button.Title>
                        <Settings2 color={colors.zinc[200]} size={20}/>
                    </Button>
                </View>

                <Input>
                    <UserRoundPlus color={colors.zinc[400]} size={20}/>
                    <Input.Field placeholder='Who will be on the trip?'/>
                </Input>

                <Button>
                    <Button.Title>Continue</Button.Title>
                    <ArrowRight color={colors.lime[950]} size={20}/>
                </Button>
            </View>

            <Text className='text-zinc-500 font-regular text-center text-base'>
                When planning your trip through plann.er you automatically agree to our{" "}
                <Text className='text-zinc-300 underline'>terms of use and privacy policies.</Text>
            </Text>
        </View>
    )
}