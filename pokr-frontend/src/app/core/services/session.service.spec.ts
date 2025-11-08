import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';
import { CreateSessionRequest, SessionDto } from '../models/session.model';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showInfo']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SessionService,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });

    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a session', () => {
    const request: CreateSessionRequest = {
      facilitatorName: 'John Doe',
      sessionName: 'Sprint Planning'
    };

    const mockResponse: SessionDto = {
      id: 1,
      code: 'ABC123',
      name: 'Sprint Planning',
      facilitatorName: 'John Doe',
      status: 'Active',
      createdAt: new Date(),
      currentStoryId: null,
      currentStory: null,
      participants: [],
      stories: []
    };

    service.createSession(request).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(notificationService.showSuccess).toHaveBeenCalledWith('Session created successfully!');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/sessions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should get session status', () => {
    const sessionCode = 'ABC123';
    const mockResponse = {
      code: sessionCode,
      name: 'Sprint Planning',
      facilitatorName: 'John Doe',
      participantCount: 3,
      storiesCount: 5,
      estimatedStoriesCount: 2,
      currentStory: null,
      participants: [],
      stories: []
    };

    service.getSessionStatus(sessionCode).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/sessions/${sessionCode}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
