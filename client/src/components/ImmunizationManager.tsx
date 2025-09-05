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
import { Plus, Shield, Calendar, AlertCircle, User2, Syringe } from 'lucide-react';
import type { Immunization, CreateImmunizationInput, Patient } from '../../../server/src/schema';

export function ImmunizationManager() {
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateImmunizationInput>({
    patient_id: 0,
    vaccine_name: '',
    vaccine_type: 'basic',
    vaccination_date: new Date(),
    next_vaccination_date: null,
    batch_number: null,
    administered_by: '',
    side_effects: null,
    notes: null
  });

  const loadImmunizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getImmunizations.query();
      setImmunizations(result);
    } catch (error) {
      console.error('Failed to load immunizations:', error);
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
    loadImmunizations();
    loadPatients();
  }, [loadImmunizations, loadPatients]);

  const handleCreateImmunization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newImmunization = await trpc.createImmunization.mutate(createFormData);
      setImmunizations((prev: Immunization[]) => [...prev, newImmunization]);
      setCreateFormData({
        patient_id: 0,
        vaccine_name: '',
        vaccine_type: 'basic',
        vaccination_date: new Date(),
        next_vaccination_date: null,
        batch_number: null,
        administered_by: '',
        side_effects: null,
        notes: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create immunization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p: Patient) => p.id === patientId);
    return patient ? patient.name : `Pasien ID: ${patientId}`;
  };

  const getVaccineTypeLabel = (type: string) => {
    const types = {
      basic: 'Dasar',
      additional: 'Tambahan',
      booster: 'Booster'
    };
    return types[type as keyof typeof types] || type;
  };

  const getVaccineTypeBadge = (type: string) => {
    const variants = {
      basic: 'default',
      additional: 'secondary',
      booster: 'outline'
    } as const;
    return variants[type as keyof typeof variants] || 'default';
  };

  const isVaccinationDue = (nextDate: Date | null) => {
    if (!nextDate) return false;
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isVaccinationOverdue = (nextDate: Date | null) => {
    if (!nextDate) return false;
    const today = new Date();
    return nextDate.getTime() < today.getTime();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-500" />
            Program Imunisasi
          </h2>
          <p className="text-gray-600 mt-1">Kelola jadwal dan riwayat vaksinasi</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Catat Imunisasi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Catat Imunisasi Baru</DialogTitle>
              <DialogDescription>
                Tambahkan catatan pemberian vaksin untuk pasien.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateImmunization}>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="create-patient">Pasien *</Label>
                  <Select 
                    value={createFormData.patient_id === 0 ? '' : createFormData.patient_id.toString()} 
                    onValueChange={(value: string) => 
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
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
                  <Label htmlFor="create-vaccine-name">Nama Vaksin *</Label>
                  <Input
                    id="create-vaccine-name"
                    value={createFormData.vaccine_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        vaccine_name: e.target.value 
                      }))
                    }
                    placeholder="Contoh: BCG, DPT, Hepatitis B"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-vaccine-type">Jenis Vaksin *</Label>
                  <Select 
                    value={createFormData.vaccine_type} 
                    onValueChange={(value: 'basic' | 'additional' | 'booster') => 
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        vaccine_type: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Dasar</SelectItem>
                      <SelectItem value="additional">Tambahan</SelectItem>
                      <SelectItem value="booster">Booster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-vaccination-date">Tanggal Vaksinasi *</Label>
                  <Input
                    id="create-vaccination-date"
                    type="datetime-local"
                    value={createFormData.vaccination_date.toISOString().slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        vaccination_date: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-next-date">Jadwal Vaksinasi Berikutnya</Label>
                  <Input
                    id="create-next-date"
                    type="date"
                    value={createFormData.next_vaccination_date?.toISOString().split('T')[0] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        next_vaccination_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-batch">Nomor Batch</Label>
                  <Input
                    id="create-batch"
                    value={createFormData.batch_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        batch_number: e.target.value || null 
                      }))
                    }
                    placeholder="Nomor batch vaksin"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-administered-by">Diberikan Oleh *</Label>
                  <Input
                    id="create-administered-by"
                    value={createFormData.administered_by}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        administered_by: e.target.value 
                      }))
                    }
                    placeholder="Nama petugas/dokter"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-side-effects">Efek Samping</Label>
                  <Textarea
                    id="create-side-effects"
                    value={createFormData.side_effects || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
                        ...prev, 
                        side_effects: e.target.value || null 
                      }))
                    }
                    placeholder="Catat efek samping jika ada"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-notes">Catatan Tambahan</Label>
                  <Textarea
                    id="create-notes"
                    value={createFormData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateImmunizationInput) => ({ 
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
                <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600">
                  {isLoading ? 'Menyimpan...' : 'Simpan Data Imunisasi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Immunizations List */}
      {isLoading && immunizations.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data imunisasi...</p>
        </div>
      ) : immunizations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Imunisasi</h3>
            <p className="text-gray-600 mb-4">
              Mulai dengan mencatat imunisasi pertama.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Catat Imunisasi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {immunizations.map((immunization: Immunization) => (
            <Card key={immunization.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Syringe className="h-5 w-5 text-green-500" />
                      {getPatientName(immunization.patient_id)}
                      <Badge variant={getVaccineTypeBadge(immunization.vaccine_type)}>
                        {getVaccineTypeLabel(immunization.vaccine_type)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <Calendar className="h-4 w-4" />
                      Vaksinasi: {immunization.vaccination_date.toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Vaksin:</p>
                      <p className="text-sm text-gray-900">{immunization.vaccine_name}</p>
                    </div>
                    
                    {immunization.batch_number && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Batch:</p>
                        <p className="text-sm text-gray-900">{immunization.batch_number}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Diberikan oleh:</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <User2 className="h-4 w-4 text-gray-400" />
                        {immunization.administered_by}
                      </p>
                    </div>
                    
                    {immunization.next_vaccination_date && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Vaksinasi berikutnya:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900">
                            {immunization.next_vaccination_date.toLocaleDateString('id-ID')}
                          </p>
                          {isVaccinationOverdue(immunization.next_vaccination_date) && (
                            <Badge variant="destructive" className="text-xs">
                              Terlambat
                            </Badge>
                          )}
                          {isVaccinationDue(immunization.next_vaccination_date) && (
                            <Badge variant="secondary" className="text-xs">
                              Segera
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {immunization.side_effects && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Efek Samping:</p>
                          <p className="text-sm text-yellow-700">{immunization.side_effects}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {immunization.notes && (
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Catatan:</strong> {immunization.notes}
                      </p>
                    </div>
                  )}

                  <Separator />
                  <div className="text-xs text-gray-500">
                    ID Imunisasi: #{immunization.id} • Dicatat: {immunization.created_at.toLocaleDateString('id-ID')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}