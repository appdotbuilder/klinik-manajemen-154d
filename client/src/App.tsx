import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientManager } from '@/components/PatientManager';
import { DeliveryServiceManager } from '@/components/DeliveryServiceManager';
import { ImmunizationManager } from '@/components/ImmunizationManager';
import { MedicalCheckupManager } from '@/components/MedicalCheckupManager';
import { Heart, Baby, Shield, Stethoscope, Users, Activity } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('patients');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Klinik Health Center 🏥
              </h1>
              <p className="text-sm text-gray-600">
                Sistem Manajemen Layanan Kesehatan Terpadu
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Pasien</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">-</div>
              <p className="text-xs text-blue-600">Terdaftar aktif</p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-pink-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">Layanan Persalinan</CardTitle>
              <Baby className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-800">-</div>
              <p className="text-xs text-pink-600">Total persalinan</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Imunisasi</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">-</div>
              <p className="text-xs text-green-600">Vaksin diberikan</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Medical Checkup</CardTitle>
              <Stethoscope className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">-</div>
              <p className="text-xs text-purple-600">Pemeriksaan selesai</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger 
                value="patients" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Pasien
              </TabsTrigger>
              <TabsTrigger 
                value="delivery" 
                className="data-[state=active]:bg-pink-500 data-[state=active]:text-white"
              >
                <Baby className="h-4 w-4 mr-2" />
                Persalinan
              </TabsTrigger>
              <TabsTrigger 
                value="immunization" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                Imunisasi
              </TabsTrigger>
              <TabsTrigger 
                value="checkup" 
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Medical Checkup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="mt-6">
              <PatientManager />
            </TabsContent>

            <TabsContent value="delivery" className="mt-6">
              <DeliveryServiceManager />
            </TabsContent>

            <TabsContent value="immunization" className="mt-6">
              <ImmunizationManager />
            </TabsContent>

            <TabsContent value="checkup" className="mt-6">
              <MedicalCheckupManager />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="font-semibold">Klinik Health Center</span>
            </div>
            <p>Sistem Manajemen Kesehatan Digital untuk Layanan Prima</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;