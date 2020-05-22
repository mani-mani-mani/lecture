import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.geom.Point2D.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import object.*;
import contract.*;

public class Main extends Canvas {
    public static void main(String[] args) {
        System.out.println("choose algorithm");
        System.out.println("    dr:  De Casteljau -Recursive-");
        System.out.println("    dl:  De Casteljau -Loop-");
        System.out.println("    b:   Bernstein");

        Scanner scan = new Scanner(System.in);
        String algo = scan.next();

        Bezier bezier = new NullBezier();
        switch (algo) {
            case "dr":
                bezier = new DecasteljauRecursiveBezier();
                break;
            case "dl":
                bezier = new DecasteljauLoopBezier();
                break;
            case "b":
                bezier = new BernsteinBezier();
                break;
            default:
                System.err.println("Unrecognized algorithm is choosed");
                System.err.println("You choose " + algo);
                System.err.println("Please input 'dr' or 'dl' or 'b'");
                System.exit(1);
                break;
        }

        System.out.print("Input number of bezier step number => ");
        int numberOfPoints = Integer.parseInt(scan.next());
        new Main(bezier, numberOfPoints);
    }

    private final int width = 500; // window width
    private final int height = 500; // windows height
    int dragPointIndex = -1; // drag point index
    private List<Point2D> points = new ArrayList<Point2D>(); // control points
    Bezier bezier;
    int numberOfPoints;

    protected Main(Bezier bezier, int numberOfPoints) {
        super();
        setSize(this.width, this.height);
        setBackground(Color.white);
        setForeground(Color.black);
        this.bezier = bezier;
        this.numberOfPoints = numberOfPoints;

        Frame f = new Frame("Main Canvas");
        f.add(this);
        f.pack();

        // mouse event
        addMouseListener(new MouseAdapter() {
            public void mousePressed(MouseEvent me) {
                // get close point
                double x = me.getX();
                double y = me.getY();
                Point2D pressPoint = new Point2D.Double(x, y);

                for (Point2D point : points) {
                    if (point.distance(pressPoint) < 30.0) {
                        dragPointIndex = points.indexOf(point);
                        repaint();
                    }
                }
            }

            public void mouseReleased(MouseEvent me) {
                dragPointIndex = -1;
            }

            public void mouseClicked(MouseEvent me) {
                // add new point
                double x = me.getX();
                double y = me.getY();
                points.add(new Point2D.Double(x, y));
                repaint();
            }
        });

        // mouse motion event
        addMouseMotionListener(new MouseMotionAdapter() {
            public void mouseDragged(MouseEvent me) {
                if (dragPointIndex != -1) {
                    double x = me.getX();
                    double y = me.getY();

                    points.set(dragPointIndex, new Point2D.Double(x, y));
                    repaint();
                }
            }
        });
        // window event
        f.addWindowListener(new WindowAdapter() {
            public void windowClosing(WindowEvent e) {
                System.exit(0);
            }
        });
        f.setVisible(true);
    }

    public void paint(Graphics g) {
        // polyline
        g.setColor(Color.black);
        for (int i = 0; i < this.points.size() - 1; i++) {
            g.drawLine((int) this.points.get(i).getX(), (int) this.points.get(i).getY(),
                    (int) this.points.get(i + 1).getX(), (int) this.points.get(i + 1).getY());
        }

        // points draggable point
        g.setColor(Color.red);
        for (Point2D point : points) {
            g.drawRoundRect((int) point.getX() - 1, (int) point.getY() - 1, 3, 3, 1, 1);
        }
        // other points
        g.setColor(Color.blue);
        if (this.dragPointIndex != -1) {
            g.drawRoundRect((int) this.points.get(dragPointIndex).getX() - 1,
                    (int) this.points.get(dragPointIndex).getY() - 1, 3, 3, 1, 1);
        }

        // bezier curve
        g.setColor(Color.blue);
        if (this.points.size() > 0) {
            List<Point2D> bezierPoints = bezier.execute(this.points, numberOfPoints);
            for (int i = 0; i < bezierPoints.size() - 1; i++) {
                g.drawLine((int) bezierPoints.get(i).getX(), (int) bezierPoints.get(i).getY(),
                        (int) bezierPoints.get(i + 1).getX(), (int) bezierPoints.get(i + 1).getY());
            }
        }
    }
}