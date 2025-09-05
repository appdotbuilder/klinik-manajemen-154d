import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Plus, Baby, Calendar, User, Weight, AlertTriangle, User2 } from 'lucide-react';
import type { DeliveryService, CreateDeliveryServiceInput, Patient } from '../../../server/src/schema';

export function DeliveryServiceManager() {
  const [deliveryServices, setDeliveryServices] = useState<DeliveryService[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateDeliveryServiceInput>({
    patient_id: 0,
    delivery_date: new Date(),
    delivery_type: 'normal',
    baby_weight: 0,
    baby_gender: 'female',
    baby_name: null,
    complications: null,
    doctor_name: '',
    notes: null
  });

  const loadDeliveryServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getDeliveryServices.query();
      setDeliveryServices(result);
    } catch (error) {
      console.error('Failed to load delivery services:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  }, []);

  useEffect(() => {
    loadDeliveryServices();
    loadPatients();
  }, [loadDeliveryServices, loadPatients]);

  const handleCreateDeliveryService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newDeliveryService = await trpc.createDeliveryService.mutate(createFormData);
      setDeliveryServices((prev: DeliveryService[]) => [...prev, newDeliveryService]);
      setCreateFormData({
        patient_id: 0,
        delivery_date: new Date(),
        delivery_type: 'normal',
        baby_weight: 0,
        baby_gender: 'female',
        baby_name: null,
        complications: null,
        doctor_name: '',
        notes: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create delivery service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p: Patient) => p.id === patientId);
    return patient ? patient.name : `Pasien ID: ${patientId}`;
  };

  const getDeliveryTypeLabel = (type: string) => {
    const types = {
      normal: 'Normal',
      caesarean: 'Caesar',
      assisted: 'Dibantu'
    };
    return types[type as keyof typeof types] || type;
  };

  const getDeliveryTypeBadge = (type: string) => {
    const variants = {
      normal: 'default',
      caesarean: 'destructive',
      assisted: 'secondary'
    } as const;
    return variants[type as keyof typeof variants] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Baby className="h-6 w-6 text-pink-500" />
            Layanan Persalinan
          </h2>
          <p className="text-gray-600 mt-1">Kelola data persalinan dan kelahiran</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-500 hover:bg-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data Persalinan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Data Persalinan</DialogTitle>
              <DialogDescription>
                Catat informasi persalinan dan kelahiran baru.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDeliveryService}>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="create-patient">Pasien *</Label>
                  <Select 
                    value={createFormData.patient_id === 0 ? '' : createFormData.patient_id.toString()} 
                    onValueChange={(value: string) => 
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        patient_id: parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pasien" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: Patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-delivery-date">Tanggal Persalinan *</Label>
                  <Input
                    id="create-delivery-date"
                    type="datetime-local"
                    value={createFormData.delivery_date.toISOString().slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        delivery_date: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-delivery-type">Jenis Persalinan *</Label>
                  <Select 
                    value={createFormData.delivery_type} 
                    onValueChange={(value: 'normal' | 'caesarean' | 'assisted') => 
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        delivery_type: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="caesarean">Caesar</SelectItem>
                      <SelectItem value="assisted">Dibantu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-baby-weight">Berat Bayi (kg) *</Label>
                    <Input
                      id="create-baby-weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={createFormData.baby_weight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                          ...prev, 
                          baby_weight: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="create-baby-gender">Jenis Kelamin Bayi *</Label>
                    <Select 
                      value={createFormData.baby_gender} 
                      onValueChange={(value: 'male' | 'female') => 
                        setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                          ...prev, 
                          baby_gender: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Perempuan</SelectItem>
                        <SelectItem value="male">Laki-laki</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-baby-name">Nama Bayi</Label>
                  <Input
                    id="create-baby-name"
                    value={createFormData.baby_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        baby_name: e.target.value || null 
                      }))
                    }
                    placeholder="Nama bayi (opsional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-doctor">Nama Dokter *</Label>
                  <Input
                    id="create-doctor"
                    value={createFormData.doctor_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        doctor_name: e.target.value 
                      }))
                    }
                    placeholder="Dr. Nama Dokter"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-complications">Komplikasi</Label>
                  <Textarea
                    id="create-complications"
                    value={createFormData.complications || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        complications: e.target.value || null 
                      }))
                    }
                    placeholder="Catat komplikasi jika ada"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-notes">Catatan Tambahan</Label>
                  <Textarea
                    id="create-notes"
                    value={createFormData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateDeliveryServiceInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    placeholder="Catatan khusus lainnya"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-pink-500 hover:bg-pink-600">
                  {isLoading ? 'Menyimpan...' : 'Simpan Data Persalinan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delivery Services List */}
      {isLoading && deliveryServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data persalinan...</p>
        </div>
      ) : deliveryServices.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Baby className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Persalinan</h3>
            <p className="text-gray-600 mb-4">
              Mulai dengan menambahkan data persalinan pertama.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data Persalinan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deliveryServices.map((delivery: DeliveryService) => (
            <Card key={delivery.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      👶 {getPatientName(delivery.patient_id)}
                      <Badge variant={getDeliveryTypeBadge(delivery.delivery_type)}>
                        {getDeliveryTypeLabel(delivery.delivery_type)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <Calendar className="h-4 w-4" />
                      {delivery.delivery_date.toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Weight className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>Berat:</strong> {delivery.baby_weight} kg
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>Gender:</strong> {delivery.baby_gender === 'female' ? '👧 Perempuan' : '👦 Laki-laki'}
                    </span>
                  </div>
                  
                  {delivery.baby_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        <strong>Nama:</strong> {delivery.baby_name}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      <strong>Dokter:</strong> {delivery.doctor_name}
                    </span>
                  </div>
                </div>

                {delivery.complications && (
                  <div className="mb-4">
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Komplikasi:</p>
                        <p className="text-sm text-red-700">{delivery.complications}</p>
                      </div>
                    </div>
                  </div>
                )}

                {delivery.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Catatan:</strong> {delivery.notes}
                    </p>
                  </div>
                )}

                <Separator className="my-4" />
                <div className="text-xs text-gray-500">
                  ID Persalinan: #{delivery.id} • Dicatat: {delivery.created_at.toLocaleDateString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}