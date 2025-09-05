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
import { UserPlus, Edit2, Phone, MapPin, Calendar, User } from 'lucide-react';
import type { Patient, CreatePatientInput, UpdatePatientInput } from '../../../server/src/schema';

export function PatientManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating patients
  const [createFormData, setCreateFormData] = useState<CreatePatientInput>({
    name: '',
    date_of_birth: new Date(),
    gender: 'female',
    phone: null,
    address: null
  });

  // Form state for editing patients
  const [editFormData, setEditFormData] = useState<UpdatePatientInput>({
    id: 0,
    name: '',
    date_of_birth: new Date(),
    gender: 'female',
    phone: null,
    address: null
  });

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPatients.query();
      setPatients(result);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newPatient = await trpc.createPatient.mutate(createFormData);
      setPatients((prev: Patient[]) => [...prev, newPatient]);
      setCreateFormData({
        name: '',
        date_of_birth: new Date(),
        gender: 'female',
        phone: null,
        address: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    
    setIsLoading(true);
    try {
      const updatedPatient = await trpc.updatePatient.mutate(editFormData);
      setPatients((prev: Patient[]) => 
        prev.map((patient: Patient) => 
          patient.id === updatedPatient.id ? updatedPatient : patient
        )
      );
      setIsEditDialogOpen(false);
      setEditingPatient(null);
    } catch (error) {
      console.error('Failed to update patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setEditFormData({
      id: patient.id,
      name: patient.name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address
    });
    setIsEditDialogOpen(true);
  };

  const getAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6 text-blue-500" />
            Manajemen Pasien
          </h2>
          <p className="text-gray-600 mt-1">Kelola data pasien klinik</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Pasien Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pasien Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi pasien baru yang akan didaftarkan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePatient}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nama Lengkap *</Label>
                  <Input
                    id="create-name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-dob">Tanggal Lahir *</Label>
                  <Input
                    id="create-dob"
                    type="date"
                    value={createFormData.date_of_birth.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ 
                        ...prev, 
                        date_of_birth: new Date(e.target.value) 
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-gender">Jenis Kelamin *</Label>
                  <Select 
                    value={createFormData.gender} 
                    onValueChange={(value: 'male' | 'female') => 
                      setCreateFormData((prev: CreatePatientInput) => ({ ...prev, gender: value }))
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
                
                <div className="space-y-2">
                  <Label htmlFor="create-phone">Nomor Telepon</Label>
                  <Input
                    id="create-phone"
                    value={createFormData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ 
                        ...prev, 
                        phone: e.target.value || null 
                      }))
                    }
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-address">Alamat</Label>
                  <Textarea
                    id="create-address"
                    value={createFormData.address || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreatePatientInput) => ({ 
                        ...prev, 
                        address: e.target.value || null 
                      }))
                    }
                    placeholder="Alamat lengkap pasien"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600">
                  {isLoading ? 'Menyimpan...' : 'Simpan Pasien'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Patients List */}
      {isLoading && patients.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data pasien...</p>
        </div>
      ) : patients.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Pasien</h3>
            <p className="text-gray-600 mb-4">
              Mulai dengan menambahkan pasien pertama Anda.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Pasien
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {patients.map((patient: Patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {patient.name}
                      <Badge variant={patient.gender === 'female' ? 'secondary' : 'outline'}>
                        {patient.gender === 'female' ? '👩 Perempuan' : '👨 Laki-laki'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {patient.date_of_birth.toLocaleDateString('id-ID')} ({getAge(patient.date_of_birth)} tahun)
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(patient)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{patient.phone}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{patient.address}</span>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="text-xs text-gray-500">
                  ID Pasien: #{patient.id} • Terdaftar: {patient.created_at.toLocaleDateString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Pasien</DialogTitle>
            <DialogDescription>
              Perbarui informasi pasien yang diperlukan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPatient}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Lengkap *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-dob">Tanggal Lahir *</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editFormData.date_of_birth?.toISOString().split('T')[0] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ 
                      ...prev, 
                      date_of_birth: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Jenis Kelamin *</Label>
                <Select 
                  value={editFormData.gender} 
                  onValueChange={(value: 'male' | 'female') => 
                    setEditFormData((prev: UpdatePatientInput) => ({ ...prev, gender: value }))
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
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Nomor Telepon</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ 
                      ...prev, 
                      phone: e.target.value || null 
                    }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-address">Alamat</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdatePatientInput) => ({ 
                      ...prev, 
                      address: e.target.value || null 
                    }))
                  }
                  rows={3}
                />
              </div>
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