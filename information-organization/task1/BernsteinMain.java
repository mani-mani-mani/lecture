import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.geom.Point2D.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import object.*;
import contract.*;

public class BernsteinMain extends Canvas {
    public static void main(String[] args) {
        new BernsteinMain();
    }

    private final int width = 500; // window width
    private final int height = 500; // windows height
    
    protected BernsteinMain() {
        super();
        setSize(this.width, this.height);
        setBackground(Color.white);
        setForeground(Color.black);

        Frame f = new Frame("Main Canvas");
        f.add(this);
        f.pack();

        // window event
        f.addWindowListener(new WindowAdapter() {
            public void windowClosing(WindowEvent e) {
                System.exit(0);
            }
        });
        f.setVisible(true);
    }

    public void paint(Graphics g) {
        final int degree = 5;
        g.drawString("degree = " + degree, 235, 50);
        
        // bernstein curve
        g.setColor(Color.red);
        for (int d = 0; d <= degree; d++) {
            List<Point2D> points = new ArrayList<Point2D>(1000);
            for (int di = 0; di <= degree; di++) {
                double x = 500.0 * di / (double)degree;
                double y = (d == di) ? 0 : 500.0;
                points.add(new Point2D.Double(x, y));
            }

            List<Point2D> bezierPoints = (new BernsteinBezier()).execute(points, 200);
            for (int i = 0; i < bezierPoints.size() - 1; i++) {
                g.drawLine((int) bezierPoints.get(i).getX(), (int) bezierPoints.get(i).getY(),
                        (int) bezierPoints.get(i + 1).getX(), (int) bezierPoints.get(i + 1).getY());
            }
        }
    }
}