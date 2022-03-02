/*
 * OpenGL Spaceship shooter
 * Author: Jameel Kaba
*/

// Include statements
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <gl/glut.h>
#include <math.h>
#include <string.h>

// Definitions
#define PI 3.14159
#define GAME_SCREEN 0
#define MENU_SCREEN 4
#define MAX_STONES  100
#define MAX_STONE_TYPES 5
#define stoneRotationSpeed 20
#define SPACESHIP_SPEED 20
int stoneTranslationSpeed = 5;

GLint m_viewport[4];
GLint CI = 0;
int x,y;
int i;
int randomStoneIndices[100];
int index;
int Score = 0;
int alienLife = 100;
int GameLvl = 1;

// Cursor coordinates
float mouseX, mouseY;
float LaserAngle = 0, stoneAngle = 0, lineWidth = 1;

// Spaceship coordinates
float xOne = 0, yOne = 0;

// Coordinates for stones/asteroids
float xStone[MAX_STONES], yStone[MAX_STONES];

// Starting coordinate for the health bar
float xStart = 1200;

// Check to see if a stone/asteroid has been destroyed
GLint stoneAlive[MAX_STONES];

// Bool values to check the state of the game
bool mButtonPressed = false, startGame = false, gameOver = false;
bool startScreen = true, nextScreen = false, previousScreen = false;
bool gameQuit = false, instructionsGame = false, optionsGame = false;

GLfloat a[][2]={0, -50, 70, -50, 70, 70, -70, 70};
GLfloat LightColor[][3]={1, 1, 0, 0, 1, 1, 0, 1, 0};
GLfloat AlienBody[][2]={{-4, 9}, {-6, 0}, {0, 0}, {0.5, 9}, {0.15, 12}, {-14, 18}, {-19, 10}, {-20, 0}, {-6, 0}};
GLfloat AlienCollar[][2]={{-9, 10.5}, {-6, 11}, {-5, 12}, {6, 18}, {10, 20}, {13, 23}, {16, 30}, {19, 39}, {16, 38}, {10, 37}, {-13, 39}, {-18, 41}, {-20, 43}, {-20.5, 42}, {-21, 30}, {-19.5, 23}, {-19, 20}, {-14, 16}, {-15, 17},{-13, 13}, {-9, 10.5}};
GLfloat ALienFace[][2]={{-6, 11}, {-4.5, 18}, {0.5, 20}, {0, 20.5}, {0.1, 19.5}, {1.8, 19}, {5, 20}, {7, 23}, {9, 29}, {6, 29.5}, {5, 28}, {7, 30}, {10, 38},{11, 38}, {11, 40}, {11.5, 48}, {10, 50.5}, {8.5, 51}, {6, 52}, {1, 51}, {-3, 50},{-1, 51}, {-3, 52}, {-5, 52.5}, {-6, 52}, {-9, 51}, {-10.5, 50}, {-12, 49}, {-12.5, 47}, {-12, 43}, {-13, 40}, {-12, 38.5}, {-13.5, 33}, {-15, 38}, {-14.5, 32}, {-14, 28}, {-13.5, 33}, {-14, 28}, {-13.8, 24}, {-13, 20}, {-11, 19}, {-10.5, 12}, {-6, 11}};
GLfloat ALienBeak[][2]={{-6, 21.5}, {-6.5, 22}, {-9, 21}, {-11, 20.5}, {-20, 20}, {-14, 23}, {-9.5, 28}, {-7, 27}, {-6, 26.5}, {-4.5, 23}, {-4, 21}, {-6, 19.5}, {-8.5, 19}, {-10, 19.5}, {-11, 20.5}};

char highScore[100], ch;
void display();
void StoneGenerate();

void displayRasterText(float x, float y, float z, char *stringToDisplay) {
    int length;
    glRasterPos3f(x, y, z);
    length = strlen(stringToDisplay);

    for(int i = 0; i < length; i++){
        glutBitmapCharacter(GLUT_BITMAP_TIMES_ROMAN_24 ,stringToDisplay[i]);
    }
}
void SetDisplayMode(int modeToDisplay) {
        switch(modeToDisplay){
        case GAME_SCREEN: glClearColor(0, 0, 0, 1); break;
        case MENU_SCREEN : glClearColor(1, 0 , 0, 1); break;
    }
}

void initializeStoneArray() {
    // Random stone/asteroid index
    for(int i = 0; i < MAX_STONES; i++) {
        randomStoneIndices[i] = rand() % MAX_STONE_TYPES;
        stoneAlive[i] = true;
    }

    // Start line for stone/asteroid appearance
    xStone[0] = -(200 * MAX_STONES) - 600;
                                                
    for(int i = 0; i < MAX_STONES; i++) {
        // Random appearance yIndex for each stone/asteroid
        yStone[i] = rand() % 600;
        if(int(yStone[i]) % 2)
            yStone[i] *= -1;
        
        // xIndex of stones/asteroids aligned with a 200 unit gap
        xStone[i+1] = xStone[i] + 200;
    }
}

void DrawAlienBody() {
    // Body color
    glColor3f(0, 1, 0);
    glBegin(GL_POLYGON);
    for(i = 0; i <= 8; i++)
        glVertex2fv(AlienBody[i]);
    glEnd();

    // Body outline
    glColor3f(0, 0, 0);
    glLineWidth(1);
    glBegin(GL_LINE_STRIP);
    for(i = 0; i <= 8; i++)
        glVertex2fv(AlienBody[i]);
    glEnd();

    // Body Effect
    glBegin(GL_LINES);
    glVertex2f(-13, 11);
    glVertex2f(-15, 9);
    glEnd();
}

void DrawAlienCollar() {
    
    // Collar
    glColor3f(1, 0, 0);
    glBegin(GL_POLYGON);
    for(i = 0; i <= 20; i++)
        glVertex2fv(AlienCollar[i]);
    glEnd();

    // Collar outline
    glColor3f(0, 0, 0);
    glBegin(GL_LINE_STRIP);
    for(i = 0; i <= 20; i++)
        glVertex2fv(AlienCollar[i]);
    glEnd();
}

void DrawAlienFace() {
    // Face
    glColor3f(0, 0, 1);
    glBegin(GL_POLYGON);
    for(i = 0; i <= 42; i++)
        glVertex2fv(ALienFace[i]);
    glEnd();
    
    // Face outline
    glColor3f(0, 0, 0);
    glBegin(GL_LINE_STRIP);
    for(i = 0; i <= 42; i++)
        glVertex2fv(ALienFace[i]);
    glEnd();

    // Ear effect
    glBegin(GL_LINE_STRIP);
    glVertex2f(3.3, 22);
    glVertex2f(4.4, 23.5);
    glVertex2f(6.3, 26);
    glEnd();
}

void DrawAlienBeak() {
    // Beak color
    glColor3f(1, 1, 0);
    glBegin(GL_POLYGON);
    for(i = 0; i <= 14; i++)
        glVertex2fv(ALienBeak[i]);
    glEnd();

    // Beak outline
    glColor3f(0, 0, 0);
    glBegin(GL_LINE_STRIP);
    for(i = 0; i <= 14; i++)
        glVertex2fv(ALienBeak[i]);
    glEnd();
}

void DrawAlienEyes() {
    
    glColor3f(0,1,1);
    glPushMatrix();
    glRotated(-10,0,0,1);
    
    // Left eye
    glTranslated(-6,32.5,0);
    glScalef(2.5,4,0);
    glutSolidSphere(1,20,30);
    glPopMatrix();

    glPushMatrix();
    glRotated(-1,0,0,1);
    
    // Right eye
    glTranslated(-8,36,0);                            //Right eye
    glScalef(2.5,4,0);
    glutSolidSphere(1,100,100);
    glPopMatrix();
}

void DrawAlien() {
    DrawAlienBody();
    DrawAlienCollar();
    DrawAlienFace();
    DrawAlienBeak();
    DrawAlienEyes();
}

void DrawSpaceshipBody()
{
    glColor3f(1,0,0);

    // Base
    glPushMatrix();
    glScalef(70,20,1);
    glutSolidSphere(1,50,50);
    glPopMatrix();
            
    glPushMatrix();
    
    // Lights
    // 1
    glScalef(3,3,1);
    glTranslated(-20,0,0);
    glColor3fv(LightColor[(CI+0)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 2
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+1)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 3
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+2)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 4
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+0)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 5
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+1)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 6
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+2)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 7
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+0)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 8
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+1)%3]);
    glutSolidSphere(1,1000,1000);
    
    // 9
    glTranslated(5,0,0);
    glColor3fv(LightColor[(CI+2)%3]);
    glutSolidSphere(1,1000,1000);
            
    glPopMatrix();
}

void DrawSteeringWheel() {
    glPushMatrix();
    glLineWidth(3);
    glColor3f(0.20,0.,0.20);
    glScalef(7,4,1);
    glTranslated(-1.9,5.5,0);
    glutWireSphere(1,8,8);
    glPopMatrix();
}

void DrawSpaceshipDoom() {
    glColor4f(0.7,1,1,0.0011);
    glPushMatrix();
    glTranslated(0,30,0);
    glScalef(35,50,1);
    glutSolidSphere(1,50,50);
    glPopMatrix();
}

void DrawSpaceShiplaser() {
    
    glColor3f(1, 0, 0);
    glPushMatrix();
    
    // Laser stem
    glBegin(GL_POLYGON);
    glVertex2f(-55, 10);
    glVertex2f(-55, 30);
    glVertex2f(-50, 30);
    glVertex2f(-50, 10);
    glEnd();

    float xMid = 0, yMid = 0;
    
    // Mid point of the laser horizontal
    xMid = (55 + 50) / 2.0;
    yMid = (25 + 35) / 2.0;
    
    // Rotating about the point
    glTranslated(-xMid, yMid, 0);
    glRotated(LaserAngle, 0, 0 ,1);
    glTranslated(xMid, -yMid, 0);

    // Find mid point of top of laser stem
    float midPoint = -(55 + 50) / 2.0;

    // Laser horizontal stem
    glBegin(GL_POLYGON);
    glVertex2f(midPoint + 10 ,25);
    glVertex2f(midPoint + 10 ,35);
    glVertex2f(midPoint - 10 ,35);
    glVertex2f(midPoint - 10 ,25);
    glEnd();

    glPopMatrix();
}

void DrawLaserBeam() {

    float xMid = -(55 + 50) / 2.0;
    float yMid = (25 + 35) / 2.0;
    
    float mouseXEnd = -((- mouseX) + xOne);
    float mouseYEnd = -((- mouseY) + yOne);
    
    // Laser Beam Width
    glLineWidth(5);

    glColor3f(1, 0, 0);
    glBegin(GL_LINES);
    glVertex2f(xMid ,yMid);
    glVertex2f(mouseXEnd ,mouseYEnd);
    glEnd();
    glLineWidth(1);
}

void DrawStone(int StoneIndex) {
    glPushMatrix();
    glLoadIdentity();
    switch(StoneIndex) {
    case 0:

        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glColor3f(0.4f, 0.0f, 0.0f);
        glScalef(35, 35, 1);
        glutSolidSphere(1, 9, 50);
        
        glLoadIdentity();
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(60, 10, 1);
        glutSolidSphere(1, 5, 50);
        
        glLoadIdentity();
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(10, 60, 1);
        glutSolidSphere(1, 5, 50);
        break;

    case 1:
        glColor3f(1.0f, 0.8f, 0.8f);
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(15, 20, 1);
        glutSolidSphere(1, 9, 50);

        glLoadIdentity();
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(40, 5, 1);
        glutSolidSphere(1, 5, 50);
        break;

    case 2:
        glColor3f(0.2f, 0.2f, 0.0f);
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(60, 25, 1);
        glutSolidSphere(1, 9, 50);

        glLoadIdentity();
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(25, 60, 1);
        glutSolidSphere(1, 9, 50);
        break;

    case 3:
        glColor3f(0.8f, 0.8f, 0.1f);
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(35, 10, 1);
        glutSolidSphere(1, 10, 7);

        glLoadIdentity();
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(50, 20, 1);
        glutSolidSphere(1, 5, 50);
        break;
            
    case 4:
        glColor3f(0.26f, 0.26f, 0.26f);
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(10, 55, 1);
        glutSolidSphere(1, 9, 50);

        glLoadIdentity();
        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(20, 10, 1);
        glutSolidSphere(1, 9, 50);
        glLoadIdentity();

        glTranslated(xStone[index], yStone[index], 0);
        glRotatef(stoneAngle + 45, 0, 0, 1);
        glTranslated(0, 0, 0);
        glScalef(25, 10, 1);
        glutSolidSphere(1, 9, 50);
        break;
    }
    glPopMatrix();
}

bool checkIfSpaceShipIsSafe() {
    for(int i = 0; i < MAX_STONES; i++) {
        if(stoneAlive[i] & ((xOne >= (xStone[i] / 2 - 70) && xOne <= (xStone[i] / 2 + 70) && yOne >= (yStone[i] / 2 - 18 ) && yOne <= (yStone[i] / 2 + 53)) || (yOne <= (yStone[i] / 2 - 20) && yOne >= (yStone[i] / 2 - 90) && xOne >= (xStone[i] / 2 - 40) && xOne <= (xStone[i] / 2 + 40))))
        {
            stoneAlive[i] = 0;
            return false;
        }
    }
    return true;
}
