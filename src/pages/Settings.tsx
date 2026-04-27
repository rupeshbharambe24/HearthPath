
import React, { useState } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Heart, Shield, Users, User } from 'lucide-react';
import ThemeControls from '@/components/ThemeControls';
import BlockedUserList from '@/components/BlockedUserList';
import BreakupPanel from '@/components/BreakupPanel';
import AccountActions from '@/components/AccountActions';
import DiscoveryPreferencesCard from '@/components/settings/DiscoveryPreferencesCard';
import NotificationPreferencesCard from '@/components/settings/NotificationPreferencesCard';
import PrivacyCard from '@/components/settings/PrivacyCard';
import DataExportCard from '@/components/settings/DataExportCard';

type SettingsTab =
  | 'account'
  | 'discovery'
  | 'notifications'
  | 'privacy'
  | 'data'
  | 'relationship';

const Settings = () => {
  const [tab, setTab] = useState<SettingsTab>('account');

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account preferences and privacy settings.
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="discovery">Discovery</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="relationship">Relationship</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <div className="space-y-6">
                {/* Theme & UI Customization */}
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-romantic-red" />
                      <span>Theme & UI Customization</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ThemeControls />
                  </CardContent>
                </Card>

                {/* Privacy & Block List */}
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-romantic-red" />
                      <span>Privacy & Block List</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BlockedUserList />
                  </CardContent>
                </Card>

                {/* Account Controls */}
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-romantic-red" />
                      <span>Account Controls</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountActions />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="discovery">
              <DiscoveryPreferencesCard />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationPreferencesCard />
            </TabsContent>

            <TabsContent value="privacy">
              <PrivacyCard />
            </TabsContent>

            <TabsContent value="data">
              <DataExportCard />
            </TabsContent>

            <TabsContent value="relationship">
              <Card className="romantic-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-romantic-red" />
                    <span>Relationship Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BreakupPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Settings;
