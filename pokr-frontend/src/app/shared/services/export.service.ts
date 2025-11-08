import { Injectable } from '@angular/core';
import { SessionStatusDto, UserStoryDto } from '../../core/models/session.model';
import { SessionSummaryData } from '../components/session-summary/session-summary.component';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  exportSessionAsJson(sessionData: SessionSummaryData): void {
    const exportData = {
      session: {
        code: sessionData.session.code,
        name: sessionData.session.name,
        facilitatorName: sessionData.session.facilitatorName,
        participantCount: sessionData.session.participantCount,
        participants: sessionData.session.participants.map(p => ({
          name: p.name,
          joinedAt: p.joinedAt
        }))
      },
      summary: {
        totalStoryPoints: sessionData.totalStoryPoints,
        averageStoryPoints: sessionData.averageStoryPoints,
        sessionDuration: sessionData.sessionDuration,
        exportedAt: new Date().toISOString()
      },
      stories: {
        estimated: sessionData.estimatedStories.map(story => ({
          title: story.title,
          finalEstimate: story.finalEstimate,
          createdAt: story.createdAt,
          votes: story.votes?.map(vote => ({
            participantName: vote.participantName,
            estimate: vote.estimate,
            submittedAt: vote.submittedAt
          })) || []
        })),
        pending: sessionData.session.stories?.filter(s => 
          s.finalEstimate === null || s.finalEstimate === undefined
        ).map(story => ({
          title: story.title,
          createdAt: story.createdAt
        })) || []
      }
    };

    this.downloadFile(
      JSON.stringify(exportData, null, 2),
      `session-${sessionData.session.code}-${this.getDateString()}.json`,
      'application/json'
    );
  }

  exportSessionAsCsv(sessionData: SessionSummaryData): void {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push('Story Title,Final Estimate,Status,Created At,Votes');
    
    // Estimated stories
    sessionData.estimatedStories.forEach(story => {
      const votes = story.votes?.map(v => `${v.participantName}:${this.getEstimateDisplayValue(v.estimate)}`).join(';') || '';
      csvRows.push(`"${story.title}","${this.getEstimateDisplayValue(story.finalEstimate)}","Estimated","${story.createdAt}","${votes}"`);
    });
    
    // Pending stories
    const pendingStories = sessionData.session.stories?.filter(s => 
      s.finalEstimate === null || s.finalEstimate === undefined
    ) || [];
    
    pendingStories.forEach(story => {
      csvRows.push(`"${story.title}","Not Estimated","Pending","${story.createdAt}",""`);
    });
    
    // Add summary section
    csvRows.push('');
    csvRows.push('Session Summary');
    csvRows.push(`Session Name,"${sessionData.session.name}"`);
    csvRows.push(`Session Code,"${sessionData.session.code}"`);
    csvRows.push(`Facilitator,"${sessionData.session.facilitatorName}"`);
    csvRows.push(`Total Participants,"${sessionData.session.participantCount}"`);
    csvRows.push(`Total Story Points,"${sessionData.totalStoryPoints}"`);
    csvRows.push(`Average Story Points,"${sessionData.averageStoryPoints}"`);
    csvRows.push(`Exported At,"${new Date().toISOString()}"`);
    
    // Add participants section
    csvRows.push('');
    csvRows.push('Participants');
    sessionData.session.participants.forEach(participant => {
      csvRows.push(`"${participant.name}","${participant.joinedAt}"`);
    });

    this.downloadFile(
      csvRows.join('\n'),
      `session-${sessionData.session.code}-${this.getDateString()}.csv`,
      'text/csv'
    );
  }

  exportSessionAsPdf(sessionData: SessionSummaryData): void {
    // For PDF export, we'll create an HTML representation and use the browser's print functionality
    // In a real application, you might want to use a library like jsPDF or pdfmake
    
    const htmlContent = this.generatePdfHtml(sessionData);
    
    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        printWindow.print();
        // Close the window after printing (user can cancel)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    }
  }

  private generatePdfHtml(sessionData: SessionSummaryData): string {
    const estimatedStories = sessionData.estimatedStories.map(story => `
      <tr>
        <td>${story.title}</td>
        <td>${this.getEstimateDisplayValue(story.finalEstimate)}</td>
        <td>Estimated</td>
        <td>${new Date(story.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    const pendingStories = (sessionData.session.stories?.filter(s => 
      s.finalEstimate === null || s.finalEstimate === undefined
    ) || []).map(story => `
      <tr>
        <td>${story.title}</td>
        <td>Not Estimated</td>
        <td>Pending</td>
        <td>${new Date(story.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    const participants = sessionData.session.participants.map(p => `
      <li>${p.name} (joined: ${new Date(p.joinedAt).toLocaleDateString()})</li>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Planning Poker Session - ${sessionData.session.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .session-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary-stats { display: flex; justify-content: space-around; margin-bottom: 20px; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #333; }
          .stat-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
          ul { list-style-type: none; padding: 0; }
          li { padding: 5px 0; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Planning Poker Session Report</h1>
          <h2>${sessionData.session.name}</h2>
        </div>
        
        <div class="session-info">
          <p><strong>Session Code:</strong> ${sessionData.session.code}</p>
          <p><strong>Facilitator:</strong> ${sessionData.session.facilitatorName}</p>
          <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
          ${sessionData.sessionDuration ? `<p><strong>Duration:</strong> ${sessionData.sessionDuration}</p>` : ''}
        </div>

        <div class="summary-stats">
          <div class="stat">
            <div class="stat-value">${sessionData.session.stories?.length || 0}</div>
            <div class="stat-label">Total Stories</div>
          </div>
          <div class="stat">
            <div class="stat-value">${sessionData.estimatedStories.length}</div>
            <div class="stat-label">Estimated</div>
          </div>
          <div class="stat">
            <div class="stat-value">${sessionData.totalStoryPoints}</div>
            <div class="stat-label">Total Points</div>
          </div>
          <div class="stat">
            <div class="stat-value">${sessionData.session.participantCount}</div>
            <div class="stat-label">Participants</div>
          </div>
        </div>

        <div class="section-title">Story Estimates</div>
        <table>
          <thead>
            <tr>
              <th>Story Title</th>
              <th>Final Estimate</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${estimatedStories}
            ${pendingStories}
          </tbody>
        </table>

        <div class="section-title">Participants</div>
        <ul>
          ${participants}
        </ul>
      </body>
      </html>
    `;
  }

  private getEstimateDisplayValue(estimate: number | null | undefined): string {
    if (estimate === null || estimate === undefined) return 'Not estimated';
    
    switch (estimate) {
      case -1: return '? (Unknown)';
      case -2: return '☕ (Break needed)';
      default: return `${estimate} points`;
    }
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
}