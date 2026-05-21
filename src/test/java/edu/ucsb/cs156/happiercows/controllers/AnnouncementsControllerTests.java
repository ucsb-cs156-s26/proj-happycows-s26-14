package edu.ucsb.cs156.happiercows.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.TimeZone;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import edu.ucsb.cs156.happiercows.ControllerTestCase;
import edu.ucsb.cs156.happiercows.repositories.AnnouncementRepository;
import edu.ucsb.cs156.happiercows.entities.Announcement;

import edu.ucsb.cs156.happiercows.repositories.UserCommonsRepository;
import edu.ucsb.cs156.happiercows.entities.UserCommons;

import edu.ucsb.cs156.happiercows.repositories.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@WebMvcTest(controllers = AnnouncementsController.class)
public class AnnouncementsControllerTests extends ControllerTestCase {

    @MockBean
    AnnouncementRepository announcementRepository;

    @MockBean
    UserCommonsRepository userCommonsRepository;

    @MockBean
    UserRepository userRepository;

    @Autowired
    ObjectMapper mapper;

    @WithMockUser(roles = {"ADMIN"})
    @Test
    public void adminCanPostAnnouncements() throws Exception {

        Long commonsId = 1L;
        Long id = 0L;
        String announcement = "Hello world!";

        String startDateString = "2024-03-03T17:39";
        String endDateString = "2025-03-03T17:39";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
        Date start = sdf.parse(startDateString);
        Date end = sdf.parse(endDateString);

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .startDate(start)
                .endDate(end)
                .announcementText(announcement)
                .build();

        when(announcementRepository.save(any(Announcement.class))).thenReturn(announcementObj);

        MvcResult response = mockMvc.perform(post(
                "/api/announcements/post?commonsId={commonsId}&startDate={startDate}&endDate={endDate}&announcementText={announcement}",
                commonsId, startDateString, endDateString, announcement)
                .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).save(any(Announcement.class));

        String announcementString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementObj);
        log.info("Got back from API: {}", announcementString);
        assertEquals(expectedResponseString, announcementString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userInCommonsCanPostAnnouncements() throws Exception {

        Long commonsId = 1L;
        Long id = 0L;
        Long userId = 1L;
        String announcement = "Hello world!";

        String startDateString = "2024-03-03T17:39";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
        Date start = sdf.parse(startDateString);

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement)
                .build();

        when(announcementRepository.save(any(Announcement.class))).thenReturn(announcementObj);

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(post(
                "/api/announcements/post?commonsId={commonsId}&startDate={startDate}&announcementText={announcement}",
                commonsId, startDateString, announcement)
                .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).save(any(Announcement.class));

        String announcementString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementObj);
        log.info("Got back from API: {}", announcementString);
        assertEquals(expectedResponseString, announcementString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCanPostAnnouncementWithoutStartAndEndTime() throws Exception {

        Long commonsId = 1L;
        Long id = 0L;
        Long userId = 1L;
        String announcement = "Hello world!";

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .announcementText(announcement)
                .build();

        when(announcementRepository.save(any(Announcement.class))).thenReturn(announcementObj);

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        mockMvc.perform(post(
                "/api/announcements/post?commonsId={commonsId}&announcementText={announcement}",
                commonsId, announcement)
                .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotPostAnnouncementWithEmptyString() throws Exception {

        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "";
        String startDateString = "2024-03-03T17:39";

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(post(
                "/api/announcements/post?commonsId={commonsId}&startDate={startDate}&announcementText={announcement}",
                commonsId, startDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals("Announcement cannot be empty.", response.getResponse().getContentAsString());

        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotPostAnnouncementWithEndBeforeStart() throws Exception {

        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "Announcement";

        String startDateString = "2024-03-03T17:39";
        String endDateString = "2022-03-03T17:39";

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(post(
                "/api/announcements/post?commonsId={commonsId}&startDate={startDate}&endDate={endDate}&announcementText={announcement}",
                commonsId, startDateString, endDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals("Start date must be before end date.", response.getResponse().getContentAsString());

        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userNotInCommonsCannotPostAnnouncements() throws Exception {

        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "Hello world!";
        String startDateString = "2024-03-03T17:39";

        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.empty());

        MvcResult response = mockMvc.perform(post(
                "/api/announcements/post?commonsId={commonsId}&startDate={startDate}&announcementText={announcement}",
                commonsId, startDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals("Commons_id must exist.", response.getResponse().getContentAsString());

        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"ADMIN"})
    @Test
    public void adminCannotDeleteAnnouncementsThatDontExist() throws Exception {

        Long id = 0L;

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/announcements/delete?id={id}", id)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);
        verify(announcementRepository, times(0)).delete(any(Announcement.class));
    }

    @WithMockUser(roles = {"ADMIN"})
    @Test
    public void adminCanDeleteAnnouncements() throws Exception {

        Long commonsId = 1L;
        Long id = 0L;
        String announcement = "Hello world!";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT-8:00"));
        Date start = sdf.parse("2024-03-03T17:39:43.000-08:00");

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement)
                .build();

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.of(announcementObj));

        MvcResult response = mockMvc.perform(delete("/api/announcements/delete?id={id}", id)
                .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);
        verify(announcementRepository, atLeastOnce()).delete(any(Announcement.class));

        String responseString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementObj);
        log.info("Got back from API: {}", responseString);
        assertEquals(expectedResponseString, responseString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCanGetAllAnnouncements() throws Exception {

        Long id1 = 0L;
        Long id2 = 1L;
        Long commonsId = 1L;
        Long userId = 1L;
        String announcement1 = "Hello world!";
        String announcement2 = "Hello world2!";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT-8:00"));
        Date start = sdf.parse("2024-03-03T17:39:43.000-08:00");

        Announcement announcementObj1 = Announcement.builder()
                .id(id1)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement1)
                .build();

        Announcement announcementObj2 = Announcement.builder()
                .id(id2)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement2)
                .build();

        List<Announcement> announcementList = new ArrayList<>();
        announcementList.add(announcementObj1);
        announcementList.add(announcementObj2);

        Pageable pageable = PageRequest.of(0, 1000, Sort.by("startDate").descending());
        Page<Announcement> announcementPage = new PageImpl<Announcement>(announcementList, pageable, 2);

        when(announcementRepository.findByCommonsId(commonsId, pageable)).thenReturn(announcementPage);

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(get("/api/announcements/getbycommonsid?commonsId={commonsId}", commonsId))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByCommonsId(commonsId, pageable);

        String responseString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementPage);
        assertEquals(expectedResponseString, responseString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotGetAllAnnouncementsIfNotInCommons() throws Exception {

        Long commonsId = 1L;
        Long userId = 1L;

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.empty());

        Pageable pageable = PageRequest.of(0, 1000, Sort.by("startDate").descending());

        mockMvc.perform(get("/api/announcements/getbycommonsid?commonsId={commonsId}", commonsId))
                .andExpect(status().isBadRequest())
                .andReturn();

        verify(announcementRepository, times(0)).findByCommonsId(commonsId, pageable);
    }

    @WithMockUser(roles = {"ADMIN"})
    @Test
    public void adminCanGetAllAnnouncements() throws Exception {

        Long id1 = 0L;
        Long id2 = 1L;
        Long commonsId = 1L;
        String announcement1 = "Hello world!";
        String announcement2 = "Hello world2!";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT-8:00"));
        Date start = sdf.parse("2024-03-03T17:39:43.000-08:00");

        Announcement announcementObj1 = Announcement.builder()
                .id(id1)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement1)
                .build();

        Announcement announcementObj2 = Announcement.builder()
                .id(id2)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement2)
                .build();

        List<Announcement> announcementList = new ArrayList<>();
        announcementList.add(announcementObj1);
        announcementList.add(announcementObj2);

        Pageable pageable = PageRequest.of(0, 1000, Sort.by("startDate").descending());
        Page<Announcement> announcementPage = new PageImpl<Announcement>(announcementList, pageable, 2);

        when(announcementRepository.findByCommonsId(commonsId, pageable)).thenReturn(announcementPage);

        MvcResult response = mockMvc.perform(get("/api/announcements/getbycommonsid?commonsId={commonsId}", commonsId))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByCommonsId(commonsId, pageable);

        String responseString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementPage);
        assertEquals(expectedResponseString, responseString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCanGetAnnouncementById() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        String announcement = "Hello world!";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT-8:00"));
        Date start = sdf.parse("2024-03-03T17:39:43.000-08:00");

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement)
                .build();

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.of(announcementObj));

        MvcResult response = mockMvc.perform(get("/api/announcements/getbyid?id={id}", id))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);

        String responseString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementObj);
        assertEquals(expectedResponseString, responseString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotGetAnnouncementByIdThatDoesNotExist() throws Exception {

        Long id = 0L;

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/announcements/getbyid?id={id}", id))
                .andExpect(status().isBadRequest())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);
    }

    @WithMockUser(roles = {"ADMIN"})
    @Test
    public void adminCanEditAnnouncement() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        String announcement = "Hello world!";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT-8:00"));
        Date start = sdf.parse("2024-03-03T17:39:43.000-08:00");

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .startDate(start)
                .announcementText(announcement)
                .build();

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.of(announcementObj));

        MvcResult response = mockMvc.perform(get("/api/announcements/getbyid?id={id}", id))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);

        String responseString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementObj);
        assertEquals(expectedResponseString, responseString);

        String editedAnnouncement = "Hello world edited!";
        String editedStartDateString = "2023-03-03T17:39";
        String editedEndDateString = "2025-03-03T17:39";

        SimpleDateFormat editSdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
        Date editedStart = editSdf.parse(editedStartDateString);
        Date editedEnd = editSdf.parse(editedEndDateString);

        Announcement editedAnnouncementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .startDate(editedStart)
                .endDate(editedEnd)
                .announcementText(editedAnnouncement)
                .build();

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.of(announcementObj));
        when(announcementRepository.save(any(Announcement.class))).thenReturn(editedAnnouncementObj);

        MvcResult editedResponse = mockMvc.perform(put(
                "/api/announcements/put?id={id}&commonsId={commonsId}&startDate={startDate}&endDate={endDate}&announcementText={announcement}",
                id, commonsId, editedStartDateString, editedEndDateString, editedAnnouncement)
                .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);
        verify(announcementRepository, atLeastOnce()).save(any(Announcement.class));

        String editedResponseString = editedResponse.getResponse().getContentAsString();
        String editedExpectedResponseString = mapper.writeValueAsString(editedAnnouncementObj);
        assertEquals(editedExpectedResponseString, editedResponseString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCanEditAnnouncementWithoutStart() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "Hello world!";

        Announcement announcementObj = Announcement.builder()
                .id(id)
                .commonsId(commonsId)
                .announcementText(announcement)
                .build();

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.of(announcementObj));
        when(announcementRepository.save(any(Announcement.class))).thenReturn(announcementObj);

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(put(
                "/api/announcements/put?id={id}&commonsId={commonsId}&announcementText={announcement}",
                id, commonsId, announcement)
                .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);
        verify(announcementRepository, atLeastOnce()).save(any(Announcement.class));

        String responseString = response.getResponse().getContentAsString();
        String expectedResponseString = mapper.writeValueAsString(announcementObj);
        assertEquals(expectedResponseString, responseString);
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotEditAnnouncementIfNotInCommons() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "Hello world!";
        String startDateString = "2024-03-03T17:39";

        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.empty());

        MvcResult response = mockMvc.perform(put(
                "/api/announcements/put?id={id}&commonsId={commonsId}&startDate={startDate}&announcementText={announcement}",
                id, commonsId, startDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals("Commons_id must exist.", response.getResponse().getContentAsString());

        verify(announcementRepository, times(0)).findByAnnouncementId(id);
        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotEditAnnouncementThatDoesNotExist() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "Hello world!";
        String startDateString = "2024-03-03T17:39";

        when(announcementRepository.findByAnnouncementId(id)).thenReturn(Optional.empty());

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(put(
                "/api/announcements/put?id={id}&commonsId={commonsId}&startDate={startDate}&announcementText={announcement}",
                id, commonsId, startDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals(
                "Announcement could not be found. Invalid id.",
                response.getResponse().getContentAsString());

        verify(announcementRepository, atLeastOnce()).findByAnnouncementId(id);
        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotEditAnnouncementToHaveEmptyStringAsAnnouncement() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "";
        String startDateString = "2024-03-03T17:39";

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(put(
                "/api/announcements/put?id={id}&commonsId={commonsId}&startDate={startDate}&announcementText={announcement}",
                id, commonsId, startDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals("Announcement cannot be empty.", response.getResponse().getContentAsString());

        verify(announcementRepository, times(0)).findByAnnouncementId(id);
        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }

    @WithMockUser(roles = {"USER"})
    @Test
    public void userCannotEditAnnouncementToHaveEndBeforeStart() throws Exception {

        Long id = 0L;
        Long commonsId = 1L;
        Long userId = 1L;
        String announcement = "Announcement";

        String startDateString = "2024-03-03T17:39";
        String endDateString = "2022-03-03T17:39";

        UserCommons userCommons = UserCommons.builder().build();
        when(userCommonsRepository.findByCommonsIdAndUserId(commonsId, userId)).thenReturn(Optional.of(userCommons));

        MvcResult response = mockMvc.perform(put(
                "/api/announcements/put?id={id}&commonsId={commonsId}&startDate={startDate}&endDate={endDate}&announcementText={announcement}",
                id, commonsId, startDateString, endDateString, announcement)
                .with(csrf()))
                .andExpect(status().isBadRequest())
                .andReturn();

        assertEquals("Start date must be before end date.", response.getResponse().getContentAsString());

        verify(announcementRepository, times(0)).findByAnnouncementId(id);
        verify(announcementRepository, times(0)).save(any(Announcement.class));
    }
}
