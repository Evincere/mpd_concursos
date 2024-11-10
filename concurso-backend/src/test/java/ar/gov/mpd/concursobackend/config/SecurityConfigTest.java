package ar.gov.mpd.concursobackend.config;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.Before;

@RunWith(SpringRunner.class)
@SpringBootTest
public class SecurityConfigTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Before
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    public void testPublicEndpoint() throws Exception {
        mockMvc.perform(get("/auth/login").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    public void testAuthenticatedEndpoint() throws Exception {
        mockMvc.perform(get("/some/protected/endpoint").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    public void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/some/protected/endpoint").with(csrf())
                .principal(() -> null))
                .andExpect(status().isUnauthorized());
    }
}
    