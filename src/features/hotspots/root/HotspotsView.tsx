import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutAnimation, Platform } from 'react-native'
import { useSelector } from 'react-redux'
import { Hotspot, Validator, Witness } from '@helium/http'
import { useSharedValue } from 'react-native-reanimated'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { RootStackParamList } from '../../../navigation/main/tabTypes'
import Box from '../../../components/Box'
import Map from '../../../components/Map'
import { RootState } from '../../../store/rootReducer'
import hotspotDetailsSlice, {
  fetchHotspotData,
} from '../../../store/hotspotDetails/hotspotDetailsSlice'
import HotspotsViewHeader from './HotspotsViewHeader'
import HotspotsList from './HotspotsList'
import HotspotDetails, { HotspotSnapPoints } from '../details/HotspotDetails'
import HotspotSettingsProvider from '../settings/HotspotSettingsProvider'
import HotspotSettings from '../settings/HotspotSettings'
import HotspotSearch from './HotspotSearch'
import { getPlaceGeography, PlacePrediction } from '../../../utils/googlePlaces'
import hotspotSearchSlice from '../../../store/hotspotSearch/hotspotSearchSlice'
import {
  hotspotHasValidLocation,
  locationIsValid,
} from '../../../utils/location'
import { GlobalOpt, HotspotStackParamList } from './hotspotTypes'
import animateTransition from '../../../utils/animateTransition'
import usePrevious from '../../../utils/usePrevious'
import useMount from '../../../utils/useMount'
import { fetchHotspotsForHex } from '../../../store/discovery/discoverySlice'
import { MapFilters } from '../../map/MapFiltersButton'
import MapFilterModal from '../../map/MapFilterModal'
import ShortcutNav from './ShortcutNav'
import { useAppDispatch } from '../../../store/store'
import { fetchAccountRewards } from '../../../store/account/accountSlice'
import useVisible from '../../../utils/useVisible'
import {
  fetchFollowedValidators,
  fetchMyValidators,
} from '../../../store/validators/validatorsSlice'
import ValidatorDetails from '../../validators/ValidatorDetails'
import {
  isHotspot,
  isWitness,
  isGlobalOption,
} from '../../../utils/hotspotUtils'
import { isValidator } from '../../../utils/validatorUtils'
import ValidatorExplorer from '../../validators/ValidatorExplorer'

type Props = {
  ownedHotspots?: Hotspot[]
  followedHotspots?: Hotspot[]
  ownedValidators: Validator[]
  followedValidators: Validator[]
  startOnMap?: boolean
  location?: number[]
  onRequestShowMap: (prompt: boolean) => void
}

type Route = RouteProp<HotspotStackParamList, 'HotspotsScreen'>

const SHEET_ANIM_DURATION = 500
const HotspotsView = ({
  ownedHotspots,
  followedHotspots,
  ownedValidators,
  followedValidators,
  startOnMap,
  onRequestShowMap,
  location: propsLocation,
}: Props) => {
  const navigation = useNavigation()
  const { params } = useRoute<Route>()
  const dispatch = useAppDispatch()
  const [location, setLocation] = useState(propsLocation)
  const [showMap, setShowMap] = useState(false)
  const [detailSnapPoints, setDetailSnapPoints] = useState<HotspotSnapPoints>({
    collapsed: 0,
    expanded: 0,
  })
  const [detailHeight, setDetailHeight] = useState(0)
  const fleetModeEnabled = useSelector(
    (state: RootState) => state.app.isFleetModeEnabled,
  )
  const hotspotsForHexId = useSelector(
    (state: RootState) => state.discovery.hotspotsForHexId,
  )
  const accountRewards = useSelector(
    (state: RootState) => state.account.rewardsSum,
  )
  const hotspotsLoaded = useSelector(
    (state: RootState) => state.hotspots.hotspotsLoaded,
  )
  const myValidatorsLoaded = useSelector(
    (state: RootState) => state.validators.myValidatorsLoaded,
  )
  const followedValidatorsLoaded = useSelector(
    (state: RootState) => state.validators.followedValidatorsLoaded,
  )
  const [selectedHexId, setSelectedHexId] = useState<string>()
  const [selectedHotspotIndex, setSelectedHotspotIndex] = useState(0)
  const animatedIndex = useSharedValue<number>(0)
  const [mapFilter, setMapFilter] = useState(MapFilters.owned)
  const [shortcutItem, setShortcutItem] = useState<
    GlobalOpt | Hotspot | Witness | Validator
  >(startOnMap ? 'explore' : 'home')
  const prevShorcutItem = usePrevious(shortcutItem)

  const hotspotAddress = useMemo(() => {
    if (!isHotspot(shortcutItem)) return ''

    return shortcutItem.address
  }, [shortcutItem])

  const selectedHotspot = useMemo(() => {
    if (!shortcutItem || (!isHotspot(shortcutItem) && !isWitness(shortcutItem)))
      return

    return shortcutItem
  }, [shortcutItem])

  const selectedValidator = useMemo(() => {
    if (!shortcutItem || !isValidator(shortcutItem)) return

    return shortcutItem
  }, [shortcutItem])

  const showWitnesses = useMemo(() => mapFilter === MapFilters.witness, [
    mapFilter,
  ])

  const showOwned = useMemo(() => mapFilter === MapFilters.owned, [mapFilter])

  const showRewardScale = useMemo(() => mapFilter === MapFilters.reward, [
    mapFilter,
  ])

  useVisible({
    onAppear: () => {
      dispatch(fetchAccountRewards())
      dispatch(fetchMyValidators())
      dispatch(fetchFollowedValidators())
    },
  })

  useEffect(() => {
    if (shortcutItem === 'explore' && prevShorcutItem !== 'explore') {
      onRequestShowMap(true)
    }
  }, [onRequestShowMap, prevShorcutItem, shortcutItem])

  const handleShortcutItemSelected = useCallback(
    (item: GlobalOpt | Hotspot | Witness | Validator) => {
      if (shortcutItem === item) return

      let animConfig = LayoutAnimation.Presets.spring

      const springDamping = Platform.select({ ios: 0.9, android: 2 })
      animConfig = {
        ...animConfig,
        create: { ...animConfig.create, springDamping },
        update: { ...animConfig.update, springDamping },
        delete: { ...animConfig.delete, springDamping },
      }
      animateTransition('HotspotsView.ShortcutChanged', {
        enabledOnAndroid: false,
        config: animConfig,
      })
      setShortcutItem(item)
    },
    [shortcutItem],
  )

  const setGlobalOption = useCallback(
    (opt: GlobalOpt) => {
      handleShortcutItemSelected(opt)
      setSelectedHexId(undefined)
      setSelectedHotspotIndex(0)
    },
    [handleShortcutItemSelected],
  )

  useEffect(() => {
    const navParent = navigation.dangerouslyGetParent() as BottomTabNavigationProp<RootStackParamList>
    if (!navParent) return

    return navParent.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        setGlobalOption('home')
      }
    })
  }, [navigation, setGlobalOption])

  useMount(() => {
    if (startOnMap) {
      setShowMap(true)
      return
    }

    setTimeout(() => {
      setShowMap(true)
    }, SHEET_ANIM_DURATION)
  })

  const hasHotspots = useMemo(
    () => !!(ownedHotspots?.length || followedHotspots?.length),
    [followedHotspots?.length, ownedHotspots?.length],
  )

  const hotspotDetailsData =
    useSelector(
      (state: RootState) => state.hotspotDetails.hotspotData[hotspotAddress],
    ) || {}

  const { witnesses } = hotspotDetailsData || {}

  const hasUserLocation = useMemo(
    () =>
      location &&
      location.length === 2 &&
      location[0] !== 0 &&
      location[1] !== 0,
    [location],
  )

  useEffect(() => {
    if (hotspotAddress || hasUserLocation) return

    if (
      ownedHotspots &&
      ownedHotspots.length > 0 &&
      hotspotHasValidLocation(ownedHotspots[0])
    ) {
      setLocation([ownedHotspots[0].lng || 0, ownedHotspots[0].lat || 0]) // Set map loc to one of their hotspots
    } else if (
      followedHotspots &&
      followedHotspots.length > 0 &&
      hotspotHasValidLocation(followedHotspots[0])
    ) {
      setLocation([followedHotspots[0].lng || 0, followedHotspots[0].lat || 0]) // Set map loc to one of their followed hotspots
    } else {
      setLocation([-122.4194, 37.7749]) // SF - Browsing map without location permission and hotspots
    }
  }, [followedHotspots, hasUserLocation, hotspotAddress, ownedHotspots])

  const onMapHexSelected = useCallback(
    async (hexId: string, address?: string) => {
      const hotspots = (await dispatch(fetchHotspotsForHex({ hexId }))) as {
        payload?: Hotspot[]
      }

      let index = 0
      if (address && hotspots?.payload) {
        const foundIndex = hotspots.payload.findIndex(
          (h) => h?.address === address,
        )
        if (foundIndex >= 0) {
          index = foundIndex
        }
      }
      setSelectedHexId(hexId)
      setSelectedHotspotIndex(index)
      if (hotspots?.payload?.length) {
        handleShortcutItemSelected(hotspots.payload[index] as Hotspot)
      }
    },
    [dispatch, handleShortcutItemSelected],
  )

  const handlePresentHotspot = useCallback(
    async (hotspot: Hotspot | Witness) => {
      if (isGlobalOption(shortcutItem)) {
        setDetailHeight(detailSnapPoints.collapsed)
      }
      handleShortcutItemSelected(hotspot)

      if (!hotspot.locationHex) return

      onMapHexSelected(hotspot.locationHex, hotspot.address)
    },
    [
      detailSnapPoints.collapsed,
      handleShortcutItemSelected,
      onMapHexSelected,
      shortcutItem,
    ],
  )
  const handlePresentValidator = useCallback(
    (validator: Validator) => {
      handleShortcutItemSelected(validator)
    },
    [handleShortcutItemSelected],
  )

  const handleItemSelected = useCallback(
    (item?: GlobalOpt | Hotspot | Validator) => {
      if (!item) {
        setGlobalOption('home')
        return
      }
      if (isGlobalOption(item)) {
        setGlobalOption(item)
      } else if (isHotspot(item)) {
        handlePresentHotspot(item)
      } else {
        handlePresentValidator(item)
      }
    },
    [handlePresentHotspot, handlePresentValidator, setGlobalOption],
  )

  useEffect(() => {
    if (!params?.address) return

    // Fetch the hotspot for deep links
    const fetchHotspot = async () => {
      const hotspot = (await dispatch(fetchHotspotData(params.address))) as {
        payload?: { hotspot: Hotspot }
      }
      if (!hotspot.payload?.hotspot) return

      handlePresentHotspot(hotspot.payload.hotspot)
    }

    fetchHotspot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const handleSelectPlace = useCallback(
    async (place: PlacePrediction) => {
      const placeLocation = await getPlaceGeography(place.placeId)
      setGlobalOption('explore')
      setLocation([placeLocation.lng, placeLocation.lat])
    },
    [setGlobalOption],
  )

  const dismissList = useCallback(() => {
    setGlobalOption('explore')
  }, [setGlobalOption])

  const hexHotspots = useMemo(() => {
    if (!selectedHexId) return []
    return hotspotsForHexId[selectedHexId]
  }, [hotspotsForHexId, selectedHexId])

  const onHotspotSelected = useCallback(
    (index, hotspot) => {
      setSelectedHotspotIndex(index)
      handleShortcutItemSelected(hotspot)
    },
    [handleShortcutItemSelected],
  )

  const hotspotHasLocation = useMemo(() => {
    if (!hotspotAddress || !selectedHotspot) return true

    return hotspotHasValidLocation(
      selectedHotspot || hotspotDetailsData.hotspot,
    )
  }, [hotspotAddress, hotspotDetailsData.hotspot, selectedHotspot])

  const toggleSettings = useCallback(() => {
    dispatch(hotspotDetailsSlice.actions.toggleShowSettings())
  }, [dispatch])

  const handleHotspotSetup = useCallback(
    () => navigation.navigate('HotspotSetup'),
    [navigation],
  )

  const onPressMapFilter = useCallback(() => {
    dispatch(hotspotDetailsSlice.actions.toggleShowMapFilter())
  }, [dispatch])

  const handleSearching = useCallback(
    (searching: boolean) => () => {
      setGlobalOption(searching ? 'search' : 'home')
      dispatch(hotspotSearchSlice.actions.clear())
    },
    [dispatch, setGlobalOption],
  )

  const body = useMemo(() => {
    return (
      <>
        <HotspotSearch
          onSelectHotspot={handlePresentHotspot}
          onSelectPlace={handleSelectPlace}
          onSelectValidator={handlePresentValidator}
          visible={shortcutItem === 'search'}
        />
        <ValidatorExplorer visible={shortcutItem === 'validators'} />
        <HotspotDetails
          visible={isHotspot(shortcutItem)}
          hotspot={selectedHotspot}
          onLayoutSnapPoints={setDetailSnapPoints}
          onChangeHeight={setDetailHeight}
          onFailure={handleItemSelected}
          onSelectHotspot={handlePresentHotspot}
          toggleSettings={toggleSettings}
          animatedPosition={animatedIndex}
        />

        <HotspotsList
          onRequestShowMap={dismissList}
          onSelectHotspot={handlePresentHotspot}
          visible={shortcutItem === 'home'}
          searchPressed={handleSearching(true)}
          addHotspotPressed={handleHotspotSetup}
          hasHotspots={hasHotspots}
          accountRewards={accountRewards}
        />
        <ValidatorDetails validator={selectedValidator} />
      </>
    )
  }, [
    handlePresentHotspot,
    handleSelectPlace,
    handlePresentValidator,
    shortcutItem,
    selectedHotspot,
    handleItemSelected,
    toggleSettings,
    animatedIndex,
    dismissList,
    handleSearching,
    handleHotspotSetup,
    hasHotspots,
    accountRewards,
    selectedValidator,
  ])

  const onChangeMapFilter = useCallback((filter: MapFilters) => {
    setMapFilter(filter)
  }, [])

  const cameraBottomOffset = useMemo(() => {
    if (isGlobalOption(shortcutItem)) return
    return detailHeight
  }, [detailHeight, shortcutItem])

  return (
    <>
      <Box flex={1} flexDirection="column" justifyContent="space-between">
        <Box position="absolute" height="100%" width="100%">
          {showMap && (
            <Map
              cameraBottomOffset={cameraBottomOffset}
              ownedHotspots={showOwned ? ownedHotspots : []}
              selectedHotspot={selectedHotspot}
              maxZoomLevel={12}
              zoomLevel={12}
              witnesses={showWitnesses ? witnesses : []}
              followedHotspots={showOwned ? followedHotspots : []}
              mapCenter={location}
              animationMode="easeTo"
              animationDuration={800}
              onHexSelected={onMapHexSelected}
              interactive={hotspotHasLocation}
              showNoLocation={!hotspotHasLocation}
              showNearbyHotspots
              showH3Grid
              showRewardScale={showRewardScale}
            />
          )}
          <HotspotsViewHeader
            animatedPosition={animatedIndex}
            hexHotspots={hexHotspots}
            ownedHotspots={ownedHotspots}
            detailHeaderHeight={detailSnapPoints.collapsed}
            onHotspotSelected={onHotspotSelected}
            followedHotspots={followedHotspots}
            selectedHotspotIndex={selectedHotspotIndex}
            mapFilter={mapFilter}
            onPressMapFilter={onPressMapFilter}
            showDetails={typeof shortcutItem !== 'string'}
            buttonsVisible
            showNoLocation={
              !locationIsValid(propsLocation) && shortcutItem === 'explore'
            }
          />
        </Box>
        {body}

        <HotspotSettingsProvider>
          {selectedHotspot && <HotspotSettings hotspot={selectedHotspot} />}
        </HotspotSettingsProvider>
        <MapFilterModal
          mapFilter={mapFilter}
          onChangeMapFilter={onChangeMapFilter}
        />
      </Box>

      <ShortcutNav
        ownedHotspots={!fleetModeEnabled && ownedHotspots ? ownedHotspots : []}
        followedHotspots={followedHotspots || []}
        ownedValidators={
          !fleetModeEnabled && ownedValidators ? ownedValidators : []
        }
        followedValidators={followedValidators || []}
        selectedItem={shortcutItem}
        onItemSelected={handleItemSelected}
        initialDataLoaded={
          hotspotsLoaded && myValidatorsLoaded && followedValidatorsLoaded
        }
      />
    </>
  )
}

export default memo(HotspotsView)
