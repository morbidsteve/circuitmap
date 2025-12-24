'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PanelForm } from '@/components/forms/PanelForm'
import { usePanels, useCreatePanel, useDeletePanel } from '@/hooks/usePanels'
import { Plus, Zap, MapPin, Layers, Trash2, MoreVertical, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: panels, isLoading } = usePanels()
  const createPanel = useCreatePanel()
  const deletePanel = useDeletePanel()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch('/api/panels/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import')
      }

      const result = await response.json()
      queryClient.invalidateQueries({ queryKey: ['panels'] })
      setIsImportOpen(false)
      router.push(`/dashboard/panels/${result.panelId}`)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import panel')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCreatePanel = async (data: {
    name: string
    address?: string
    brand: string
    mainAmperage: number
    totalSlots?: number
    columns?: number
    notes?: string
  }) => {
    try {
      const newPanel = await createPanel.mutateAsync(data)
      setIsCreateOpen(false)
      router.push(`/dashboard/panels/${newPanel.id}`)
    } catch (error) {
      console.error('Failed to create panel:', error)
    }
  }

  const handleDeletePanel = async () => {
    if (!deleteId) return
    try {
      await deletePanel.mutateAsync(deleteId)
      setDeleteId(null)
    } catch (error) {
      console.error('Failed to delete panel:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Panels</h1>
            <p className="text-muted-foreground">
              Manage your electrical panel mappings
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Panels</h1>
          <p className="text-muted-foreground">
            Manage your electrical panel mappings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Panel
          </Button>
        </div>
      </div>

      {!panels || panels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No panels yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first electrical panel
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Panel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {panels.map((panel) => {
            const deviceCount = panel.floors.reduce(
              (acc, floor) =>
                acc + floor.rooms.reduce((acc2, room) => acc2 + room.devices.length, 0),
              0
            )

            return (
              <Card key={panel.id} className="h-full hover:shadow-md transition-shadow group relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          setDeleteId(panel.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`/dashboard/panels/${panel.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between pr-8">
                      <div>
                        <CardTitle className="text-lg">{panel.name}</CardTitle>
                        {panel.address && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {panel.address}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary">{panel.mainAmperage}A</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{panel.breakers.length}</div>
                        <div className="text-xs text-muted-foreground">Breakers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{panel.floors.length}</div>
                        <div className="text-xs text-muted-foreground">Floors</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{deviceCount}</div>
                        <div className="text-xs text-muted-foreground">Devices</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span className="capitalize">
                          {panel.brand.replace('_', ' ')}
                        </span>
                        <span className="text-xs">
                          {panel.totalSlots} slots
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Panel Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Panel</DialogTitle>
            <DialogDescription>
              Create a new electrical panel to start mapping your circuits.
            </DialogDescription>
          </DialogHeader>
          <PanelForm
            onSubmit={handleCreatePanel}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={createPanel.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Panel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this panel and all its breakers, floors, rooms, and devices.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePanel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePanel.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Panel Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Import Panel</DialogTitle>
            <DialogDescription>
              Upload a CircuitMap export file to restore a panel backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Select backup file</Label>
              <Input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Only .json files exported from CircuitMap are supported
              </p>
            </div>

            {importError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {importError}
              </div>
            )}

            {isImporting && (
              <div className="text-sm text-muted-foreground text-center">
                Importing panel...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
