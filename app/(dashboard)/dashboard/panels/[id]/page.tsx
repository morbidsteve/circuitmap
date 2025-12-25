'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PanelView } from '@/components/panel/PanelView'
import { CircuitView } from '@/components/panel/CircuitView'
import { BreakerSummaryView } from '@/components/panel/BreakerSummaryView'
import { FloorPlanEditor } from '@/components/floorplan/FloorPlanEditor'
import { RoomTab } from '@/components/panel/RoomTab'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PanelForm } from '@/components/forms/PanelForm'
import { BreakerForm } from '@/components/forms/BreakerForm'
import { FloorForm } from '@/components/forms/FloorForm'
import { RoomForm } from '@/components/forms/RoomForm'
import { DeviceForm } from '@/components/forms/DeviceForm'
import { DeviceFormWithRoomSelect } from '@/components/forms/DeviceFormWithRoomSelect'
import { usePanel, useUpdatePanel, useDeletePanel } from '@/hooks/usePanels'
import { useCreateBreaker, useUpdateBreaker, useDeleteBreaker, useSplitTandemBreaker } from '@/hooks/useBreakers'
import { useCreateFloor, useUpdateFloor, useDeleteFloor } from '@/hooks/useFloors'
import { useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms'
import { useCreateDevice, useUpdateDevice, useDeleteDevice } from '@/hooks/useDevices'
import { Device, Breaker, Floor, Room } from '@/types/panel'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Zap,
  Home,
  Plug,
  ChevronRight,
  MapPin,
  MoreVertical,
  Network,
  X,
  List,
  Map,
  Download,
  Scissors,
  LayoutGrid,
  Eye,
  Filter,
  Group,
  ArrowUpDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ModalState =
  | { type: 'none' }
  | { type: 'editPanel' }
  | { type: 'deletePanel' }
  | { type: 'createBreaker'; position?: string }
  | { type: 'editBreaker'; breaker: Breaker }
  | { type: 'deleteBreaker'; breaker: Breaker }
  | { type: 'createFloor' }
  | { type: 'editFloor'; floor: Floor }
  | { type: 'deleteFloor'; floor: Floor }
  | { type: 'createRoom'; floorId: string }
  | { type: 'editRoom'; room: Room; floorId: string }
  | { type: 'deleteRoom'; room: Room }
  | { type: 'createDevice'; roomId: string }
  | { type: 'createDeviceForBreaker'; breakerId: string }
  | { type: 'editDevice'; device: Device; roomId: string }
  | { type: 'deleteDevice'; device: Device }

export default function PanelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const panelId = params.id as string

  const { data: panel, isLoading } = usePanel(panelId)

  const updatePanel = useUpdatePanel()
  const deletePanel = useDeletePanel()
  const createBreaker = useCreateBreaker()
  const updateBreaker = useUpdateBreaker()
  const deleteBreaker = useDeleteBreaker()
  const splitTandemBreaker = useSplitTandemBreaker()
  const createFloor = useCreateFloor()
  const updateFloor = useUpdateFloor()
  const deleteFloor = useDeleteFloor()
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()
  const deleteDevice = useDeleteDevice()

  const [selectedBreakerId, setSelectedBreakerId] = useState<string>()
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' })
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('breakers')
  const [selectedRoomIdForNavigation, setSelectedRoomIdForNavigation] = useState<string | null>(null)
  const [selectedFloorIdForNavigation, setSelectedFloorIdForNavigation] = useState<string | null>(null)
  // Device tab state
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'unassigned' | string>('all')
  const [deviceGroupBy, setDeviceGroupBy] = useState<'none' | 'type' | 'room' | 'floor' | 'breaker'>('none')
  const [deviceSortBy, setDeviceSortBy] = useState<'name' | 'type' | 'location'>('name')
  const hasMigratedTandems = useRef(false)

  // Auto-migrate any combined tandem breakers (e.g., "14A/14B") to separate records
  useEffect(() => {
    if (panel && !hasMigratedTandems.current) {
      hasMigratedTandems.current = true

      // Check if there are any combined tandem breakers to migrate
      const hasCombinedTandems = panel.breakers.some(b =>
        /^\d+[AB]\/\d+[AB]$/i.test(b.position)
      )

      if (hasCombinedTandems) {
        fetch(`/api/panels/${panel.id}/migrate-tandems`, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.migrated > 0) {
              // Refetch panel data to get updated breakers
              window.location.reload()
            }
          })
          .catch(err => console.error('Failed to migrate tandems:', err))
      }
    }
  }, [panel])

  const closeModal = () => setModalState({ type: 'none' })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!panel) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Panel Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The panel you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const selectedBreaker = panel.breakers.find((b) => b.id === selectedBreakerId)

  // Get all devices connected to selected breaker
  const connectedDevices: (Device & { roomName: string; floorName: string })[] = []
  if (selectedBreaker) {
    panel.floors.forEach((floor) => {
      floor.rooms.forEach((room) => {
        room.devices.forEach((device) => {
          if (device.breakerId === selectedBreaker.id) {
            connectedDevices.push({
              ...device,
              roomName: room.name,
              floorName: floor.name,
            })
          }
        })
      })
    })
  }

  // Get all devices for the Devices tab
  const allDevices: (Device & { roomName: string; floorName: string; roomId: string })[] = []
  panel.floors.forEach((floor) => {
    floor.rooms.forEach((room) => {
      room.devices.forEach((device) => {
        allDevices.push({
          ...device,
          roomName: room.name,
          floorName: floor.name,
          roomId: room.id,
        })
      })
    })
  })

  const toggleFloor = (floorId: string) => {
    const newExpanded = new Set(expandedFloors)
    if (newExpanded.has(floorId)) {
      newExpanded.delete(floorId)
    } else {
      newExpanded.add(floorId)
    }
    setExpandedFloors(newExpanded)
  }

  // Navigation helpers
  const navigateToRoom = (roomId: string) => {
    setSelectedRoomIdForNavigation(roomId)
    setActiveTab('rooms')
  }

  const navigateToFloorPlan = (floorId: string) => {
    setSelectedFloorIdForNavigation(floorId)
    setActiveTab('floorplan')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{panel.name}</h1>
            {panel.address && (
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {panel.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Download export file
              window.location.href = `/api/panels/${panelId}/export`;
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModalState({ type: 'editPanel' })}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setModalState({ type: 'deletePanel' })}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="breakers" className="gap-2 min-w-fit">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Panel</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2 min-w-fit">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="circuits" className="gap-2 min-w-fit">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">Circuits</span>
          </TabsTrigger>
          <TabsTrigger value="floorplan" className="gap-2 min-w-fit">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Floor Plan</span>
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2 min-w-fit">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Rooms</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2 min-w-fit">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2 min-w-fit">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
        </TabsList>

        {/* Breakers Tab */}
        <TabsContent value="breakers">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Panel View */}
            <div className="lg:col-span-2">
              <PanelView
                breakers={panel.breakers}
                totalSlots={panel.totalSlots}
                mainAmperage={panel.mainAmperage}
                selectedBreakerId={selectedBreakerId}
                onBreakerClick={setSelectedBreakerId}
                onEmptySlotClick={(position) =>
                  setModalState({ type: 'createBreaker', position })
                }
                onBreakerMove={async (breakerId, newPosition) => {
                  await updateBreaker.mutateAsync({
                    id: breakerId,
                    panelId,
                    data: { position: newPosition },
                  })
                }}
              />
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {selectedBreaker ? 'Breaker Details' : 'Panel Info'}
                  </CardTitle>
                  {selectedBreaker && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setModalState({ type: 'editBreaker', breaker: selectedBreaker })
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setModalState({ type: 'deleteBreaker', breaker: selectedBreaker })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedBreaker ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Position</div>
                        <div className="text-lg font-bold">{selectedBreaker.position}</div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Label</div>
                        <div className="text-lg">{selectedBreaker.label}</div>
                      </div>

                      <div className="flex gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Amperage</div>
                          <div className="text-lg font-bold">{selectedBreaker.amperage}A</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Poles</div>
                          <div className="text-lg font-bold">{selectedBreaker.poles}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge>{selectedBreaker.circuitType}</Badge>
                        <Badge variant="outline">{selectedBreaker.protectionType}</Badge>
                      </div>

                      {/* Split Tandem Button - only show for combined format like "14A/14B" */}
                      {/^\d+[AB]\/\d+[AB]$/i.test(selectedBreaker.position) && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="text-sm text-amber-800 mb-2">
                            This is a combined tandem breaker. Split it to add devices to each half separately.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                              splitTandemBreaker.mutate(
                                { id: selectedBreaker.id, panelId: panel.id },
                                {
                                  onSuccess: () => {
                                    setSelectedBreakerId(undefined)
                                  },
                                }
                              )
                            }}
                            disabled={splitTandemBreaker.isPending}
                          >
                            <Scissors className="h-4 w-4 mr-2" />
                            {splitTandemBreaker.isPending ? 'Splitting...' : 'Split into Two Breakers'}
                          </Button>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium">
                            Connected Devices ({connectedDevices.length})
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setModalState({ type: 'createDeviceForBreaker', breakerId: selectedBreaker.id })
                            }
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        {connectedDevices.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {connectedDevices.map((device) => (
                              <div
                                key={device.id}
                                className="group p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{device.description}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {device.floorName} &bull; {device.roomName}
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {device.type}
                                      </Badge>
                                      {device.isGfciProtected && (
                                        <Badge variant="outline" className="text-xs">
                                          GFCI
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        // Find the room this device belongs to
                                        let roomId = '';
                                        panel.floors.forEach((floor) => {
                                          floor.rooms.forEach((room) => {
                                            if (room.devices.some((d) => d.id === device.id)) {
                                              roomId = room.id;
                                            }
                                          });
                                        });
                                        setModalState({ type: 'editDevice', device, roomId });
                                      }}
                                      title="Edit device"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => setModalState({ type: 'deleteDevice', device })}
                                      title="Remove from breaker"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <Plug className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <div className="text-sm text-muted-foreground mb-3">
                              No devices connected to this breaker
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setModalState({ type: 'createDeviceForBreaker', breakerId: selectedBreaker.id })
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add First Device
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          className="flex-1"
                          onClick={() =>
                            setModalState({ type: 'editBreaker', breaker: selectedBreaker })
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Breaker
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive"
                          onClick={() =>
                            setModalState({ type: 'deleteBreaker', breaker: selectedBreaker })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Brand</div>
                          <div className="text-sm capitalize">{panel.brand.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            Main Amperage
                          </div>
                          <div className="text-sm">{panel.mainAmperage}A</div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="text-sm font-medium mb-2">Statistics</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Slots</span>
                            <span className="font-medium">{panel.totalSlots}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Installed Breakers</span>
                            <span className="font-medium">{panel.breakers.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Floors</span>
                            <span className="font-medium">{panel.floors.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Devices</span>
                            <span className="font-medium">{allDevices.length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground text-center pt-4 border-t">
                        Click a breaker to see details
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Breaker Summary</h3>
                <p className="text-sm text-muted-foreground">
                  View all breakers and their connected devices at a glance
                </p>
              </div>
              <Button onClick={() => setModalState({ type: 'createBreaker' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Breaker
              </Button>
            </div>

            <BreakerSummaryView
              panel={panel}
              onBreakerEdit={(breaker) => setModalState({ type: 'editBreaker', breaker })}
              onDeviceEdit={(device, roomId) => setModalState({ type: 'editDevice', device, roomId })}
              onAddDevice={(breakerId) => setModalState({ type: 'createDeviceForBreaker', breakerId })}
            />
          </div>
        </TabsContent>

        {/* Circuits Tab */}
        <TabsContent value="circuits">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Circuit Visualization</h3>
                <p className="text-sm text-muted-foreground">
                  See what each breaker powers - expand to view rooms and devices
                </p>
              </div>
              <Button onClick={() => setModalState({ type: 'createBreaker' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Breaker
              </Button>
            </div>

            <CircuitView
              panel={panel}
              onBreakerClick={(breaker) =>
                setModalState({ type: 'editBreaker', breaker })
              }
              onDeviceClick={(device, roomId) =>
                setModalState({ type: 'editDevice', device, roomId })
              }
              onAddDevice={(breakerId) =>
                setModalState({ type: 'createDeviceForBreaker', breakerId })
              }
              onDeleteBreaker={(breaker) =>
                setModalState({ type: 'deleteBreaker', breaker })
              }
              onSplitBreaker={(breaker) =>
                splitTandemBreaker.mutate({ id: breaker.id, panelId: panel.id })
              }
            />
          </div>
        </TabsContent>

        {/* Floor Plan Tab */}
        <TabsContent value="floorplan">
          <FloorPlanEditor
            floors={panel.floors}
            breakers={panel.breakers}
            panelId={panelId}
            panelName={panel.name}
            mainAmperage={panel.mainAmperage}
            initialFloorId={selectedFloorIdForNavigation}
          />
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <RoomTab
            panel={panel}
            initialRoomId={selectedRoomIdForNavigation}
            onEditDevice={(device, roomId) => setModalState({ type: 'editDevice', device, roomId })}
            onDeleteDevice={(device) => setModalState({ type: 'deleteDevice', device })}
            onAddDevice={(roomId) => setModalState({ type: 'createDevice', roomId })}
            onEditRoom={(room, floorId) => setModalState({ type: 'editRoom', room, floorId })}
          />
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Floors & Rooms</h3>
              <Button onClick={() => setModalState({ type: 'createFloor' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Floor
              </Button>
            </div>

            {panel.floors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No floors yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add floors to organize your rooms and devices
                  </p>
                  <Button onClick={() => setModalState({ type: 'createFloor' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Floor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {panel.floors
                  .sort((a, b) => b.level - a.level)
                  .map((floor) => (
                    <Card key={floor.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <button
                            className="flex items-center gap-2 text-left"
                            onClick={() => toggleFloor(floor.id)}
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${
                                expandedFloors.has(floor.id) ? 'rotate-90' : ''
                              }`}
                            />
                            <CardTitle className="text-base">{floor.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              Level {floor.level}
                            </Badge>
                          </button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setModalState({ type: 'createRoom', floorId: floor.id })}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Room
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigateToFloorPlan(floor.id)}
                                >
                                  <Map className="h-4 w-4 mr-2" />
                                  View Floor Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setModalState({ type: 'editFloor', floor })}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setModalState({ type: 'deleteFloor', floor })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardDescription>
                          {floor.rooms.length} room{floor.rooms.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </CardHeader>
                      {expandedFloors.has(floor.id) && (
                        <CardContent>
                          {floor.rooms.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic py-4 text-center">
                              No rooms yet. Add a room to start tracking devices.
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {floor.rooms.map((room) => (
                                <div
                                  key={room.id}
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
                                  onClick={() => navigateToRoom(room.id)}
                                >
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {room.name}
                                      <Eye className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {room.devices.length} device
                                      {room.devices.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigateToRoom(room.id)
                                        }}
                                      >
                                        <LayoutGrid className="h-4 w-4 mr-2" />
                                        View Room
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setModalState({
                                            type: 'createDevice',
                                            roomId: room.id,
                                          })
                                        }}
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Device
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setModalState({
                                            type: 'editRoom',
                                            room,
                                            floorId: floor.id,
                                          })
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setModalState({ type: 'deleteRoom', room })
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="space-y-4">
            {/* Header with controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold">All Devices ({allDevices.length})</h3>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter */}
                <Select value={deviceFilter} onValueChange={(v) => setDeviceFilter(v as typeof deviceFilter)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="outlet">Outlets</SelectItem>
                    <SelectItem value="light">Lights</SelectItem>
                    <SelectItem value="switch">Switches</SelectItem>
                    <SelectItem value="appliance">Appliances</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                  </SelectContent>
                </Select>

                {/* Group By */}
                <Select value={deviceGroupBy} onValueChange={(v) => setDeviceGroupBy(v as typeof deviceGroupBy)}>
                  <SelectTrigger className="w-[130px]">
                    <Group className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="type">By Type</SelectItem>
                    <SelectItem value="room">By Room</SelectItem>
                    <SelectItem value="floor">By Floor</SelectItem>
                    <SelectItem value="breaker">By Breaker</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sorts: Array<typeof deviceSortBy> = ['name', 'type', 'location']
                    const idx = sorts.indexOf(deviceSortBy)
                    setDeviceSortBy(sorts[(idx + 1) % sorts.length])
                  }}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  {deviceSortBy === 'name' ? 'Name' : deviceSortBy === 'type' ? 'Type' : 'Location'}
                </Button>
              </div>
            </div>

            {/* Active filters indicator */}
            {(deviceFilter !== 'all' || deviceGroupBy !== 'none') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Active:</span>
                {deviceFilter !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setDeviceFilter('all')}
                  >
                    {deviceFilter === 'unassigned' ? 'Unassigned' : deviceFilter}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {deviceGroupBy !== 'none' && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setDeviceGroupBy('none')}
                  >
                    Grouped by {deviceGroupBy}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}

            {allDevices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No devices yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add rooms first, then add devices to track your circuits
                  </p>
                </CardContent>
              </Card>
            ) : (() => {
              // Apply filters
              let filteredDevices = [...allDevices]
              if (deviceFilter === 'unassigned') {
                filteredDevices = filteredDevices.filter((d) => !d.breakerId)
              } else if (deviceFilter !== 'all') {
                filteredDevices = filteredDevices.filter((d) => d.type === deviceFilter)
              }

              // Apply sorting
              filteredDevices.sort((a, b) => {
                if (deviceSortBy === 'name') {
                  return (a.description || '').localeCompare(b.description || '')
                } else if (deviceSortBy === 'type') {
                  return a.type.localeCompare(b.type)
                } else {
                  return `${a.floorName}-${a.roomName}`.localeCompare(`${b.floorName}-${b.roomName}`)
                }
              })

              // Group devices
              const groups: Record<string, typeof filteredDevices> = {}
              if (deviceGroupBy === 'none') {
                groups[''] = filteredDevices
              } else {
                filteredDevices.forEach((device) => {
                  let key = ''
                  if (deviceGroupBy === 'type') {
                    key = device.type
                  } else if (deviceGroupBy === 'room') {
                    key = `${device.floorName} - ${device.roomName}`
                  } else if (deviceGroupBy === 'floor') {
                    key = device.floorName
                  } else if (deviceGroupBy === 'breaker') {
                    const breaker = panel.breakers.find((b) => b.id === device.breakerId)
                    key = breaker ? `#${breaker.position}: ${breaker.label}` : 'Unassigned'
                  }
                  if (!groups[key]) groups[key] = []
                  groups[key].push(device)
                })
              }

              if (filteredDevices.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p>No devices match the current filter</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setDeviceFilter('all')}
                      >
                        Clear filter
                      </Button>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <div className="space-y-6">
                  {Object.entries(groups).map(([groupName, devices]) => (
                    <div key={groupName || 'all'}>
                      {groupName && (
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold capitalize">{groupName}</h4>
                          <Badge variant="outline">{devices.length}</Badge>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {devices.map((device) => {
                          const breaker = panel.breakers.find((b) => b.id === device.breakerId)
                          return (
                            <Card
                              key={device.id}
                              className="hover:border-primary/50 transition-colors cursor-pointer"
                              onClick={() => navigateToRoom(device.roomId)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium">{device.description}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {device.floorName} &bull; {device.roomName}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigateToRoom(device.roomId)
                                        }}
                                      >
                                        <LayoutGrid className="h-4 w-4 mr-2" />
                                        View in Room
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setModalState({
                                            type: 'editDevice',
                                            device,
                                            roomId: device.roomId,
                                          })
                                        }}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setModalState({ type: 'deleteDevice', device })
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {device.type}
                                  </Badge>
                                  {device.subtype && (
                                    <Badge variant="outline" className="text-xs">
                                      {device.subtype}
                                    </Badge>
                                  )}
                                  {device.isGfciProtected && (
                                    <Badge variant="outline" className="text-xs text-green-600">
                                      GFCI
                                    </Badge>
                                  )}
                                </div>
                                {breaker ? (
                                  <div className="text-xs text-muted-foreground">
                                    <Zap className="h-3 w-3 inline mr-1" />
                                    Breaker #{breaker.position}: {breaker.label}
                                  </div>
                                ) : (
                                  <div className="text-xs text-orange-500">
                                    Not assigned to breaker
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Panel Dialog */}
      <Dialog open={modalState.type === 'editPanel'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Panel</DialogTitle>
            <DialogDescription>Update panel information.</DialogDescription>
          </DialogHeader>
          <PanelForm
            panel={panel}
            onSubmit={async (data) => {
              await updatePanel.mutateAsync({ id: panelId, data })
              closeModal()
            }}
            onCancel={closeModal}
            isLoading={updatePanel.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Panel Dialog */}
      <AlertDialog open={modalState.type === 'deletePanel'} onOpenChange={closeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Panel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this panel and all its data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deletePanel.mutateAsync(panelId)
                router.push('/dashboard')
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Breaker Dialog */}
      <Dialog
        open={modalState.type === 'createBreaker'}
        onOpenChange={closeModal}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Breaker</DialogTitle>
            <DialogDescription>Create a new breaker in this panel.</DialogDescription>
          </DialogHeader>
          <BreakerForm
            panelId={panelId}
            position={modalState.type === 'createBreaker' ? modalState.position : undefined}
            onSubmit={async (data) => {
              await createBreaker.mutateAsync(data)
              closeModal()
            }}
            onCancel={closeModal}
            isLoading={createBreaker.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Breaker Dialog */}
      <Dialog open={modalState.type === 'editBreaker'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Breaker</DialogTitle>
            <DialogDescription>Update breaker information.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'editBreaker' && (
            <BreakerForm
              breaker={modalState.breaker}
              panelId={panelId}
              onSubmit={async (data) => {
                await updateBreaker.mutateAsync({
                  id: modalState.breaker.id,
                  panelId,
                  data,
                })
                closeModal()
                setSelectedBreakerId(undefined)
              }}
              onCancel={closeModal}
              isLoading={updateBreaker.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Breaker Dialog */}
      <AlertDialog open={modalState.type === 'deleteBreaker'} onOpenChange={closeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Breaker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete this breaker. Devices connected to it will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (modalState.type === 'deleteBreaker') {
                  await deleteBreaker.mutateAsync({ id: modalState.breaker.id, panelId })
                  setSelectedBreakerId(undefined)
                  closeModal()
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Floor Dialog */}
      <Dialog open={modalState.type === 'createFloor'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Floor</DialogTitle>
            <DialogDescription>Add a new floor to organize rooms.</DialogDescription>
          </DialogHeader>
          <FloorForm
            panelId={panelId}
            onSubmit={async (data) => {
              await createFloor.mutateAsync(data)
              closeModal()
            }}
            onCancel={closeModal}
            isLoading={createFloor.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Floor Dialog */}
      <Dialog open={modalState.type === 'editFloor'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Floor</DialogTitle>
            <DialogDescription>Update floor information.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'editFloor' && (
            <FloorForm
              floor={modalState.floor}
              panelId={panelId}
              onSubmit={async (data) => {
                await updateFloor.mutateAsync({
                  id: modalState.floor.id,
                  panelId,
                  data: { name: data.name, level: data.level },
                })
                closeModal()
              }}
              onCancel={closeModal}
              isLoading={updateFloor.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Floor Dialog */}
      <AlertDialog open={modalState.type === 'deleteFloor'} onOpenChange={closeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Floor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete this floor and all its rooms and devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (modalState.type === 'deleteFloor') {
                  await deleteFloor.mutateAsync({ id: modalState.floor.id, panelId })
                  closeModal()
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Room Dialog */}
      <Dialog open={modalState.type === 'createRoom'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>Add a new room to this floor.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'createRoom' && (
            <RoomForm
              floorId={modalState.floorId}
              panelId={panelId}
              onSubmit={async (data) => {
                await createRoom.mutateAsync(data)
                closeModal()
              }}
              onCancel={closeModal}
              isLoading={createRoom.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={modalState.type === 'editRoom'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room information.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'editRoom' && (
            <RoomForm
              room={modalState.room}
              floorId={modalState.floorId}
              panelId={panelId}
              onSubmit={async (data) => {
                await updateRoom.mutateAsync({
                  id: modalState.room.id,
                  panelId,
                  data: { name: data.name, width: data.width, height: data.height },
                })
                closeModal()
              }}
              onCancel={closeModal}
              isLoading={updateRoom.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Room Dialog */}
      <AlertDialog open={modalState.type === 'deleteRoom'} onOpenChange={closeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete this room and all its devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (modalState.type === 'deleteRoom') {
                  await deleteRoom.mutateAsync({ id: modalState.room.id, panelId })
                  closeModal()
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Device Dialog */}
      <Dialog open={modalState.type === 'createDevice'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Device</DialogTitle>
            <DialogDescription>Add a new device to this room.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'createDevice' && (
            <DeviceForm
              roomId={modalState.roomId}
              panelId={panelId}
              breakers={panel.breakers}
              onSubmit={async (data) => {
                await createDevice.mutateAsync(data)
                closeModal()
              }}
              onCancel={closeModal}
              isLoading={createDevice.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Device for Breaker Dialog */}
      <Dialog open={modalState.type === 'createDeviceForBreaker'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Device to Breaker</DialogTitle>
            <DialogDescription>
              Add a new outlet, light, or appliance connected to this breaker.
            </DialogDescription>
          </DialogHeader>
          {modalState.type === 'createDeviceForBreaker' && (
            <DeviceFormWithRoomSelect
              panel={panel}
              breakerId={modalState.breakerId}
              onSubmit={async (data) => {
                await createDevice.mutateAsync(data)
                closeModal()
              }}
              onCancel={closeModal}
              isLoading={createDevice.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={modalState.type === 'editDevice'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device information.</DialogDescription>
          </DialogHeader>
          {modalState.type === 'editDevice' && (
            <DeviceForm
              device={modalState.device}
              roomId={modalState.roomId}
              panelId={panelId}
              breakers={panel.breakers}
              onSubmit={async (data) => {
                await updateDevice.mutateAsync({
                  id: modalState.device.id,
                  panelId,
                  data: {
                    breakerId: data.breakerId,
                    type: data.type,
                    subtype: data.subtype,
                    description: data.description,
                    estimatedWattage: data.estimatedWattage,
                    isGfciProtected: data.isGfciProtected,
                    notes: data.notes,
                  },
                })
                closeModal()
              }}
              onCancel={closeModal}
              isLoading={updateDevice.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <AlertDialog open={modalState.type === 'deleteDevice'} onOpenChange={closeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (modalState.type === 'deleteDevice') {
                  await deleteDevice.mutateAsync({ id: modalState.device.id, panelId })
                  closeModal()
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
