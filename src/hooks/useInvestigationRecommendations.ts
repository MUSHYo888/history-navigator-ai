
// ABOUTME: Enhanced hook for investigation recommendations with fallback support
// ABOUTME: Provides AI-powered recommendations with graceful degradation to clinical protocols

import { useState, useEffect } from 'react';
import { InvestigationRecommendation, RedFlag, ClinicalGuideline } from '@/types/medical';
import { AIService } from '@/services/aiService';
import { EnhancedInvestigationService } from '@/services/investigation/EnhancedInvestigationService';

interface UseInvestigationRecommendationsResult {
  recommendations: InvestigationRecommendation[];
  redFlags: RedFlag[];
  guidelines: ClinicalGuideline[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInvestigationRecommendations(
  chiefComplaint: string,
  differentialDiagnoses: any[],
  answers: Record<string, any>,
  rosData: Record<string, any>
): UseInvestigationRecommendationsResult {
  const [recommendations, setRecommendations] = useState<InvestigationRecommendation[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching investigation recommendations for:', chiefComplaint);
      
      // Try AI service first
      try {
        const clinicalSupport = await AIService.generateClinicalDecisionSupport(
          chiefComplaint,
          differentialDiagnoses,
          answers,
          rosData
        );
        
        setRecommendations(clinicalSupport.investigations || []);
        setRedFlags(clinicalSupport.redFlags || []);
        setGuidelines(clinicalSupport.guidelines || []);
        
        console.log('AI recommendations loaded successfully');
      } catch (aiError) {
        console.warn('AI service failed, using enhanced protocol-based recommendations:', aiError);
        
        // Fallback to enhanced investigation service
        const protocolRecommendations = EnhancedInvestigationService.generateSmartRecommendations(
          chiefComplaint,
          differentialDiagnoses,
          { answers, rosData }
        );
        
        setRecommendations(protocolRecommendations);
        setRedFlags(generateProtocolRedFlags(chiefComplaint, answers));
        setGuidelines(generateProtocolGuidelines(chiefComplaint));
        
        setError('AI service temporarily unavailable. Using evidence-based clinical protocols.');
      }
    } catch (err) {
      console.error('Failed to generate any recommendations:', err);
      setError('Failed to generate investigation recommendations');
      
      // Final fallback - basic recommendations
      setRecommendations(getBasicRecommendations(chiefComplaint));
      setRedFlags([]);
      setGuidelines([]);
    } finally {
      setLoading(false);
    }
  };

  const serializedDiagnoses = JSON.stringify(differentialDiagnoses);
  const serializedAnswers = JSON.stringify(answers);
  const serializedRos = JSON.stringify(rosData);

  useEffect(() => {
    if (chiefComplaint) {
      fetchRecommendations();
    }
  }, [chiefComplaint, serializedDiagnoses, serializedAnswers, serializedRos]);

  return {
    recommendations,
    redFlags,
    guidelines,
    loading,
    error,
    refetch: fetchRecommendations
  };
}

// Helper functions for fallback recommendations
function generateProtocolRedFlags(chiefComplaint: string, answers: Record<string, any>): RedFlag[] {
  const redFlags: RedFlag[] = [];
  const complaint = chiefComplaint.toLowerCase();
  
  if (complaint.includes('chest pain')) {
    redFlags.push({
      condition: 'Acute Coronary Syndrome Risk',
      severity: 'high',
      description: 'Chest pain requires urgent cardiac evaluation',
      immediateActions: ['ECG within 10 minutes', 'Troponin measurement', 'Cardiac monitoring']
    });
  }
  
  if (complaint.includes('shortness') || complaint.includes('breathless')) {
    redFlags.push({
      condition: 'Respiratory Distress',
      severity: 'high', 
      description: 'Shortness of breath may indicate serious cardiopulmonary pathology',
      immediateActions: ['Oxygen saturation monitoring', 'Chest X-ray', 'ABG if severe']
    });
  }
  
  return redFlags;
}

function generateProtocolGuidelines(chiefComplaint: string): ClinicalGuideline[] {
  const guidelines: ClinicalGuideline[] = [];
  const complaint = chiefComplaint.toLowerCase();
  
  if (complaint.includes('chest pain')) {
    guidelines.push({
      title: 'Chest Pain Evaluation',
      source: 'AHA/ACC 2021 Chest Pain Guidelines',
      recommendation: 'ECG within 10 minutes, troponin measurement, risk stratification using validated scores',
      evidenceLevel: 'A',
      applicableConditions: ['Chest Pain', 'Suspected ACS']
    });
  }
  
  if (complaint.includes('fatigue')) {
    guidelines.push({
      title: 'Fatigue Investigation',
      source: 'NICE Clinical Guidelines',
      recommendation: 'Initial investigations should include FBC, TFT, glucose, and inflammatory markers',
      evidenceLevel: 'B',
      applicableConditions: ['Fatigue', 'Tiredness']
    });
  }
  
  return guidelines;
}

function getBasicRecommendations(chiefComplaint: string): InvestigationRecommendation[] {
  return [
    {
      investigation: {
        id: 'fbc',
        name: 'Full Blood Count',
        type: 'laboratory',
        category: 'Hematology',
        indication: 'Basic screening for anemia, infection, blood disorders',
        urgency: 'routine',
        cost: 'low',
        rationale: 'Essential screening investigation for most clinical presentations'
      },
      priority: 1,
      clinicalRationale: 'Comprehensive blood analysis to identify common abnormalities',
      contraindications: []
    }
  ];
}
