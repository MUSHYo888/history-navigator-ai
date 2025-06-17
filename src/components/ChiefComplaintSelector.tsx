
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Brain, Heart, Stomach, Eye, Ear } from 'lucide-react';

interface ChiefComplaintSelectorProps {
  onSelect: (complaint: string) => void;
  onBack: () => void;
}

const commonComplaints = [
  { name: 'Headache', icon: Brain, category: 'Neurological' },
  { name: 'Chest Pain', icon: Heart, category: 'Cardiovascular' },
  { name: 'Abdominal Pain', icon: Stomach, category: 'Gastrointestinal' },
  { name: 'Shortness of Breath', icon: Heart, category: 'Respiratory' },
  { name: 'Fever', icon: Brain, category: 'General' },
  { name: 'Nausea/Vomiting', icon: Stomach, category: 'Gastrointestinal' },
  { name: 'Dizziness', icon: Brain, category: 'Neurological' },
  { name: 'Joint Pain', icon: Brain, category: 'Musculoskeletal' },
  { name: 'Back Pain', icon: Brain, category: 'Musculoskeletal' },
  { name: 'Fatigue', icon: Brain, category: 'General' },
  { name: 'Vision Problems', icon: Eye, category: 'Ophthalmologic' },
  { name: 'Ear Pain', icon: Ear, category: 'ENT' }
];

export function ChiefComplaintSelector({ onSelect, onBack }: ChiefComplaintSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customComplaint, setCustomComplaint] = useState('');

  const filteredComplaints = commonComplaints.filter(complaint =>
    complaint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomComplaint = () => {
    if (customComplaint.trim()) {
      onSelect(customComplaint.trim());
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Select Chief Complaint</CardTitle>
          <p className="text-center text-gray-600">
            Choose the primary reason for this patient's visit
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Common Complaints Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredComplaints.map((complaint) => (
              <Button
                key={complaint.name}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-300"
                onClick={() => onSelect(complaint.name)}
              >
                <complaint.icon className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-center">{complaint.name}</span>
              </Button>
            ))}
          </div>

          {/* Custom Complaint */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-3">Custom Chief Complaint</h3>
            <div className="flex space-x-3">
              <Input
                placeholder="Enter custom chief complaint..."
                value={customComplaint}
                onChange={(e) => setCustomComplaint(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomComplaint()}
                className="flex-1"
              />
              <Button 
                onClick={handleCustomComplaint}
                disabled={!customComplaint.trim()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Continue
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
