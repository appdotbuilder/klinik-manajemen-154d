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
import { Plus, Stethoscope, Calendar, User, Edit2, Heart, Activity, Thermometer, Weight } from 'lucide-react';
import type { MedicalCheckup, CreateMedicalCheckupInput, UpdateMedicalCheckupInput, Patient } from '../../../server/src/schema';

export function MedicalCheckupManager() {
  const [checkups, setCheckups] = useState<MedicalCheckup[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCheckup, setEditingCheckup] = useState<MedicalCheckup | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateMedicalCheckupInput>({
    patient_id: 0,
    checkup_date: new Date(),
    checkup_type: 'routine',
    weight: null,
    height: null,
    blood_pressure: null,
    temperature: null,
    heart_rate: null,
    symptoms: null,
    diagnosis: null,
    treatment: null,
    medication_prescribed: null,
    doctor_name: '',
    next_checkup_date: null,
    notes: null
  });

  const [editFormData, setEditFormData] = useState<UpdateMedicalCheckupInput>({
    id: 0,
    patient_id: 0,
    checkup_date: new Date(),
    checkup_type: 'routine',
    weight: null,
    height: null,
    blood_pressure: null,
    temperature: null,
    heart_rate: null,
    symptoms: null,
    diagnosis: null,
    treatment: null,
    medication_prescribed: null,
    doctor_name: '',
    next_checkup_date: null,
    notes: null
  });

  const loadCheckups = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMedicalCheckups.query();
      setCheckups(result);
    } catch (error) {
      console.error('Failed to load medical checkups:', error);
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
    loadCheckups();
    loadPatients();
  }, [loadCheckups, loadPatients]);

  const handleCreateCheckup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCheckup = await trpc.createMedicalCheckup.mutate(createFormData);
      setCheckups((prev: MedicalCheckup[]) => [...prev, newCheckup]);
      setCreateFormData({
        patient_id: 0,
        checkup_date: new Date(),
        checkup_type: 'routine',
        weight: null,
        height: null,
        blood_pressure: null,
        temperature: null,
        heart_rate: null,
        symptoms: null,
        diagnosis: null,
        treatment: null,
        medication_prescribed: null,
        doctor_name: '',
        next_checkup_date: null,
        notes: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create medical checkup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCheckup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheckup) return;
    
    setIsLoading(true);
    try {
      const updatedCheckup = await trpc.updateMedicalCheckup.mutate(editFormData);
      setCheckups((prev: MedicalCheckup[]) => 
        prev.map((checkup: MedicalCheckup) => 
          checkup.id === updatedCheckup.id ? updatedCheckup : checkup
        )
      );
      setIsEditDialogOpen(false);
      setEditingCheckup(null);
    } catch (error) {
      console.error('Failed to update medical checkup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (checkup: MedicalCheckup) => {
    setEditingCheckup(checkup);
    setEditFormData({
      id: checkup.id,
      patient_id: checkup.patient_id,
      checkup_date: checkup.checkup_date,
      checkup_type: checkup.checkup_type,
      weight: checkup.weight,
      height: checkup.height,
      blood_pressure: checkup.blood_pressure,
      temperature: checkup.temperature,
      heart_rate: checkup.heart_rate,
      symptoms: checkup.symptoms,
      diagnosis: checkup.diagnosis,
      treatment: checkup.treatment,
      medication_prescribed: checkup.medication_prescribed,
      doctor_name: checkup.doctor_name,
      next_checkup_date: checkup.next_checkup_date,
      notes: checkup.notes
    });
    setIsEditDialogOpen(true);
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find((p: Patient) => p.id === patientId);
    return patient ? patient.name : `Pasien ID: ${patientId}`;
  };

  const getCheckupTypeLabel = (type: string) => {
    const types = {
      routine: 'Rutin',
      pregnancy: 'Kehamilan',
      child: 'Anak',
      adult: 'Dewasa',
      elderly: 'Lansia'
    };
    return types[type as keyof typeof types] || type;
  };

  const getCheckupTypeBadge = (type: string) => {
    const variants = {
      routine: 'default',
      pregnancy: 'secondary',
      child: 'outline',
      adult: 'secondary',
      elderly: 'outline'
    } as const;
    return variants[type as keyof typeof variants] || 'default';
  };

  const isCheckupDue = (nextDate: Date | null) => {
    if (!nextDate) return false;
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isCheckupOverdue = (nextDate: Date | null) => {
    if (!nextDate) return false;
    const today = new Date();
    return nextDate.getTime() < today.getTime();
  };

  const renderCreateFormFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="patient">Pasien *</Label>
        <Select 
          value={createFormData.patient_id === 0 ? '' : createFormData.patient_id.toString()} 
          onValueChange={(value: string) => 
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
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
        <Label htmlFor="checkup-date">Tanggal Pemeriksaan *</Label>
        <Input
          id="checkup-date"
          type="datetime-local"
          value={createFormData.checkup_date.toISOString().slice(0, 16)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              checkup_date: new Date(e.target.value) 
            }))
          }
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="checkup-type">Jenis Pemeriksaan *</Label>
        <Select 
          value={createFormData.checkup_type} 
          onValueChange={(value: 'routine' | 'pregnancy' | 'child' | 'adult' | 'elderly') => 
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              checkup_type: value 
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="routine">Rutin</SelectItem>
            <SelectItem value="pregnancy">Kehamilan</SelectItem>
            <SelectItem value="child">Anak</SelectItem>
            <SelectItem value="adult">Dewasa</SelectItem>
            <SelectItem value="elderly">Lansia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Berat Badan (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            value={createFormData.weight || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
                ...prev, 
                weight: e.target.value ? parseFloat(e.target.value) : null 
              }))
            }
            placeholder="0.0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Tinggi Badan (cm)</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            min="0"
            value={createFormData.height || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
                ...prev, 
                height: e.target.value ? parseFloat(e.target.value) : null 
              }))
            }
            placeholder="0.0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="blood-pressure">Tekanan Darah</Label>
          <Input
            id="blood-pressure"
            value={createFormData.blood_pressure || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
                ...prev, 
                blood_pressure: e.target.value || null 
              }))
            }
            placeholder="120/80"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="temperature">Suhu Tubuh (°C)</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            value={createFormData.temperature || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
                ...prev, 
                temperature: e.target.value ? parseFloat(e.target.value) : null 
              }))
            }
            placeholder="36.5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="heart-rate">Denyut Jantung (bpm)</Label>
        <Input
          id="heart-rate"
          type="number"
          min="0"
          value={createFormData.heart_rate || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              heart_rate: e.target.value ? parseInt(e.target.value) : null 
            }))
          }
          placeholder="75"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="symptoms">Gejala/Keluhan</Label>
        <Textarea
          id="symptoms"
          value={createFormData.symptoms || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              symptoms: e.target.value || null 
            }))
          }
          placeholder="Keluhan yang dirasakan pasien"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea
          id="diagnosis"
          value={createFormData.diagnosis || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              diagnosis: e.target.value || null 
            }))
          }
          placeholder="Hasil diagnosis dokter"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="treatment">Tindakan/Terapi</Label>
        <Textarea
          id="treatment"
          value={createFormData.treatment || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              treatment: e.target.value || null 
            }))
          }
          placeholder="Tindakan medis yang diberikan"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="medication">Obat yang Diresepkan</Label>
        <Textarea
          id="medication"
          value={createFormData.medication_prescribed || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              medication_prescribed: e.target.value || null 
            }))
          }
          placeholder="Daftar obat dan dosisnya"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="doctor">Nama Dokter *</Label>
        <Input
          id="doctor"
          value={createFormData.doctor_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              doctor_name: e.target.value 
            }))
          }
          placeholder="Dr. Nama Dokter"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="next-checkup">Jadwal Kontrol Berikutnya</Label>
        <Input
          id="next-checkup"
          type="date"
          value={createFormData.next_checkup_date?.toISOString().split('T')[0] || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              next_checkup_date: e.target.value ? new Date(e.target.value) : null 
            }))
          }
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan Tambahan</Label>
        <Textarea
          id="notes"
          value={createFormData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setCreateFormData((prev: CreateMedicalCheckupInput) => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          placeholder="Catatan khusus lainnya"
          rows={3}
        />
      </div>
    </>
  );

  const renderEditFormFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="edit-patient">Pasien *</Label>
        <Select 
          value={editFormData.patient_id === 0 ? '' : editFormData.patient_id?.toString()} 
          onValueChange={(value: string) => 
            setEditFormData((prev: UpdateMedicalCheckupInput) => ({ 
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
        <Label htmlFor="edit-checkup-date">Tanggal Pemeriksaan *</Label>
        <Input
          id="edit-checkup-date"
          type="datetime-local"
          value={editFormData.checkup_date?.toISOString().slice(0, 16) || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEditFormData((prev: UpdateMedicalCheckupInput) => ({ 
              ...prev, 
              checkup_date: new Date(e.target.value) 
            }))
          }
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-checkup-type">Jenis Pemeriksaan *</Label>
        <Select 
          value={editFormData.checkup_type || 'routine'} 
          onValueChange={(value: 'routine' | 'pregnancy' | 'child' | 'adult' | 'elderly') => 
            setEditFormData((prev: UpdateMedicalCheckupInput) => ({ 
              ...prev, 
              checkup_type: value 
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="routine">Rutin</SelectItem>
            <SelectItem value="pregnancy">Kehamilan</SelectItem>
            <SelectItem value="child">Anak</SelectItem>
            <SelectItem value="adult">Dewasa</SelectItem>
            <SelectItem value="elderly">Lansia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-weight">Berat Badan (kg)</Label>
          <Input
            id="edit-weight"
            type="number"
            step="0.1"
            min="0"
            value={editFormData.weight || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditFormData((prev: UpdateMedicalCheckupInput) => ({ 
                ...prev, 
                weight: e.target.value ? parseFloat(e.target.value) : null 
              }))
            }
            placeholder="0.0"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-height">Tinggi Badan (cm)</Label>
          <Input
            id="edit-height"
            type="number"
            step="0.1"
            min="0"
            value={editFormData.height || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditFormData((prev: UpdateMedicalCheckupInput) => ({ 
                ...prev, 
                height: e.target.value ? parseFloat(e.target.value) : null 
              }))
            }
            placeholder="0.0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-doctor">Nama Dokter *</Label>
        <Input
          id="edit-doctor"
          value={editFormData.doctor_name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEditFormData((prev: UpdateMedicalCheckupInput) => ({ 
              ...prev, 
              doctor_name: e.target.value 
            }))
          }
          placeholder="Dr. Nama Dokter"
          required
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-purple-500" />
            Medical Checkup
          </h2>
          <p className="text-gray-600 mt-1">Kelola riwayat pemeriksaan medis</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pemeriksaan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Pemeriksaan Medis</DialogTitle>
              <DialogDescription>
                Catat hasil pemeriksaan medis untuk pasien.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCheckup}>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                {renderCreateFormFields()}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-purple-500 hover:bg-purple-600">
                  {isLoading ? 'Menyimpan...' : 'Simpan Pemeriksaan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medical Checkups List */}
      {isLoading && checkups.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data pemeriksaan...</p>
        </div>
      ) : checkups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Data Pemeriksaan</h3>
            <p className="text-gray-600 mb-4">
              Mulai dengan mencatat pemeriksaan medis pertama.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pemeriksaan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checkups.map((checkup: MedicalCheckup) => (
            <Card key={checkup.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-purple-500" />
                      {getPatientName(checkup.patient_id)}
                      <Badge variant={getCheckupTypeBadge(checkup.checkup_type)}>
                        {getCheckupTypeLabel(checkup.checkup_type)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <Calendar className="h-4 w-4" />
                      Pemeriksaan: {checkup.checkup_date.toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(checkup)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Vital Signs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {checkup.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Berat</p>
                          <p className="text-sm font-medium">{checkup.weight} kg</p>
                        </div>
                      </div>
                    )}
                    
                    {checkup.height && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Tinggi</p>
                          <p className="text-sm font-medium">{checkup.height} cm</p>
                        </div>
                      </div>
                    )}
                    
                    {checkup.blood_pressure && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Tekanan Darah</p>
                          <p className="text-sm font-medium">{checkup.blood_pressure}</p>
                        </div>
                      </div>
                    )}
                    
                    {checkup.temperature && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Suhu</p>
                          <p className="text-sm font-medium">{checkup.temperature}°C</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {checkup.heart_rate && (
                    <div>
                      <p className="text-sm">
                        <strong>Denyut Jantung:</strong> {checkup.heart_rate} bpm
                      </p>
                    </div>
                  )}

                  {checkup.symptoms && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Keluhan:</p>
                      <p className="text-sm text-gray-600">{checkup.symptoms}</p>
                    </div>
                  )}

                  {checkup.diagnosis && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                      <p className="text-sm text-gray-600">{checkup.diagnosis}</p>
                    </div>
                  )}

                  {checkup.treatment && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tindakan:</p>
                      <p className="text-sm text-gray-600">{checkup.treatment}</p>
                    </div>
                  )}

                  {checkup.medication_prescribed && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Obat:</p>
                      <p className="text-sm text-gray-600">{checkup.medication_prescribed}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">
                      <strong>Dokter:</strong> {checkup.doctor_name}
                    </p>
                  </div>

                  {checkup.next_checkup_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Kontrol Berikutnya:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          {checkup.next_checkup_date.toLocaleDateString('id-ID')}
                        </p>
                        {isCheckupOverdue(checkup.next_checkup_date) && (
                          <Badge variant="destructive" className="text-xs">
                            Terlambat
                          </Badge>
                        )}
                        {isCheckupDue(checkup.next_checkup_date) && (
                          <Badge variant="secondary" className="text-xs">
                            Segera
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {checkup.notes && (
                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Catatan:</strong> {checkup.notes}
                      </p>
                    </div>
                  )}

                  <Separator />
                  <div className="text-xs text-gray-500">
                    ID Pemeriksaan: #{checkup.id} • Dicatat: {checkup.created_at.toLocaleDateString('id-ID')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pemeriksaan Medis</DialogTitle>
            <DialogDescription>
              Perbarui informasi pemeriksaan medis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCheckup}>
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
              {renderEditFormFields()}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}