import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types';
import { toast } from '@/hooks/use-toast';
import { User, Calendar, Phone, Mail, Heart, AlertTriangle, Shield } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user && 'dateOfBirth' in user && user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
    gender: user && 'gender' in user ? user.gender : '',
    bloodType: user && 'bloodType' in user ? user.bloodType || '' : '',
    allergies: user && 'allergies' in user ? user.allergies?.join(', ') || '' : '',
    emergencyContactName: user && 'emergencyContact' in user ? user.emergencyContact?.name || '' : '',
    emergencyContactPhone: user && 'emergencyContact' in user ? user.emergencyContact?.phone || '' : '',
    emergencyContactRelationship: user && 'emergencyContact' in user ? user.emergencyContact?.relationship || '' : '',
  });

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple submissions
    
    try {
      setIsSaving(true);
      
      const updates: Partial<Patient> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender as 'male' | 'female' | 'other',
        bloodType: formData.bloodType,
        allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
      };

      await updateProfile(updates);
      setIsEditing(false);
      // Toast message is already handled in updateProfile function
    } catch (error) {
      // Error handling is already done in updateProfile function
      console.error('Profile save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user && 'dateOfBirth' in user && user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
        gender: user && 'gender' in user ? user.gender : '',
        bloodType: user && 'bloodType' in user ? user.bloodType || '' : '',
        allergies: user && 'allergies' in user ? user.allergies?.join(', ') || '' : '',
        emergencyContactName: user && 'emergencyContact' in user ? user.emergencyContact?.name || '' : '',
        emergencyContactPhone: user && 'emergencyContact' in user ? user.emergencyContact?.phone || '' : '',
        emergencyContactRelationship: user && 'emergencyContact' in user ? user.emergencyContact?.relationship || '' : '',
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and health details
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic profile information
            </CardDescription>
          </div>
          <Button 
            variant={isEditing ? "outline" : "default"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange('gender', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select 
                value={formData.bloodType} 
                onValueChange={(value) => handleInputChange('bloodType', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Medical Information
          </CardTitle>
          <CardDescription>
            Important medical details for healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Penicillin, Peanuts, Shellfish"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>
            Person to contact in case of emergency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Name</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Phone</Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">Relationship</Label>
              <Input
                id="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Your data is encrypted and secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-accent-light rounded-lg">
              <Shield className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium">ABDM Compliant</p>
                <p className="text-sm text-muted-foreground">
                  Your profile follows Ayushman Bharat Digital Mission guidelines for secure health data management.
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• All data is encrypted at rest and in transit</p>
              <p>• Access is controlled through explicit consent</p>
              <p>• You can revoke data access at any time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;